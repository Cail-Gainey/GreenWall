// oauth.go 处理 GitHub OAuth 流程、Token 获取以及用户信息持久化。
package main

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/pkg/browser"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"go.uber.org/zap"
)

//go:embed oauth_config.json oauth_config.example.json
var embeddedFS embed.FS

// min 返回两个整数中的较小值。
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// OAuthConfig 存储 GitHub OAuth 应用的客户端凭据。
type OAuthConfig struct {
	ClientID     string `json:"client_id"`     // GitHub 应用的 Client ID
	ClientSecret string `json:"client_secret"` // GitHub 应用的 Client Secret
	RedirectURI  string `json:"redirect_uri"`  // OAuth 回调地址
	Scopes       string `json:"scopes"`        // 申请的权限范围
}

// UserInfo 存储当前登录用户的关键信息。
type UserInfo struct {
	Username  string `json:"username"`  // GitHub 用户名
	Email     string `json:"email"`     // 用户主邮箱
	Token     string `json:"token"`     // OAuth 访问令牌
	AvatarURL string `json:"avatarUrl"` // 个人头像地址
}

// LoginResponse 表示登录操作的最终结果负载。
type LoginResponse struct {
	Success  bool      `json:"success"`           // 是否登录成功
	Message  string    `json:"message"`           // 结果详情
	UserInfo *UserInfo `json:"userInfo,omitempty"` // 成功时的用户信息
}

// loadOAuthConfig 负责从多种路径或嵌入资源中加载 OAuth 配置文件。
func (a *App) loadOAuthConfig() (*OAuthConfig, error) {
	// 尝试多个可能的配置文件路径
	possiblePaths := []string{
		"oauth_config.json",                                    // 当前目录
		filepath.Join(os.Getenv("HOME"), ".green-wall", "oauth_config.json"), // 用户目录
	}
	
	// 获取可执行文件所在目录
	if execPath, err := os.Executable(); err == nil {
		execDir := filepath.Dir(execPath)
		possiblePaths = append(possiblePaths, filepath.Join(execDir, "oauth_config.json"))
		// 对于 macOS .app 包，尝试 Resources 目录
		possiblePaths = append(possiblePaths, filepath.Join(execDir, "..", "Resources", "oauth_config.json"))
	}
	
	var configPath string
	var found bool
	
	LogInfo("查找 OAuth 配置文件")
	for _, path := range possiblePaths {
		LogDebug("尝试路径", zap.String("path", path))
		if _, err := os.Stat(path); err == nil {
			configPath = path
			found = true
			LogInfo("找到配置文件", zap.String("path", path))
			break
		}
	}
	
	if !found {
		// 尝试示例配置
		LogWarn("配置文件不存在，尝试使用示例配置")
		for _, path := range possiblePaths {
			examplePath := strings.Replace(path, "oauth_config.json", "oauth_config.example.json", 1)
			if _, err := os.Stat(examplePath); err == nil {
				configPath = examplePath
				found = true
				LogInfo("找到示例配置文件", zap.String("path", examplePath))
				break
			}
		}
	}
	
	var data []byte
	var err error
	
	if found {
		data, err = os.ReadFile(configPath)
		if err != nil {
			LogError("读取配置文件失败", zap.Error(err))
			return nil, fmt.Errorf("读取配置文件失败: %w", err)
		}
	} else {
		// 使用嵌入的配置
		LogWarn("未找到配置文件，尝试使用嵌入的配置", zap.Strings("searched_paths", possiblePaths))
		
		// 优先尝试嵌入的 oauth_config.json（如果存在）
		var embeddedData []byte
		embeddedData, err = embeddedFS.ReadFile("oauth_config.json")
		if err != nil {
			// 如果 oauth_config.json 不存在，使用 example
			LogInfo("嵌入的 oauth_config.json 不存在，使用 oauth_config.example.json")
			embeddedData, err = embeddedFS.ReadFile("oauth_config.example.json")
			if err != nil {
				LogError("读取嵌入的配置文件失败", zap.Error(err))
				return nil, fmt.Errorf("无法读取嵌入的配置文件: %w", err)
			}
		} else {
			LogInfo("使用嵌入的 oauth_config.json")
		}
		
		data = embeddedData
		
		// 尝试在用户目录创建配置文件
		userConfigPath := filepath.Join(os.Getenv("HOME"), ".green-wall", "oauth_config.json")
		userConfigDir := filepath.Dir(userConfigPath)
		if err := os.MkdirAll(userConfigDir, 0755); err == nil {
			if err := os.WriteFile(userConfigPath, data, 0644); err == nil {
				LogInfo("已在用户目录创建配置文件", zap.String("path", userConfigPath))
			}
		}
	}
	
	var config OAuthConfig
	if err := json.Unmarshal(data, &config); err != nil {
		LogError("解析配置文件失败", zap.Error(err))
		return nil, fmt.Errorf("解析配置文件失败: %w", err)
	}
	
	// 验证必需字段
	if config.ClientID == "" || config.ClientSecret == "" {
		LogError("配置文件缺少必需字段")
		return nil, fmt.Errorf("配置文件缺少必需字段")
	}
	
	if config.ClientID == "" {
		return nil, fmt.Errorf("OAuth 配置错误: client_id 不能为空")
	}
	if config.RedirectURI == "" {
		config.RedirectURI = "http://localhost:8888/callback"
	}
	if config.Scopes == "" {
		config.Scopes = "user:email"
	}
	
	return &config, nil
}

// StartOAuthLogin 启动完整的 OAuth 登录流程。
// 它会自动启动一个临时的本地 HTTP 服务器，并引导用户通过默认浏览器进行 GitHub 授权。
func (a *App) StartOAuthLogin() (*LoginResponse, error) {
	LogInfo("启动 OAuth 登录流程")
	runtime.EventsEmit(a.ctx, "login-progress", "正在初始化登录...")
	
	config, err := a.loadOAuthConfig()
	if err != nil {
		LogError("加载 OAuth 配置失败", zap.Error(err))
		runtime.EventsEmit(a.ctx, "login-progress", "登录失败")
		return &LoginResponse{
			Success: false,
			Message: fmt.Sprintf("加载 OAuth 配置失败: %v\n\n请确保 oauth_config.json 文件存在并配置正确。", err),
		}, nil
	}
	
	clientID := config.ClientID
	redirectURI := config.RedirectURI

	resultChan := make(chan *UserInfo, 1)
	errorChan := make(chan error, 1)

	mux := http.NewServeMux()
	mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		LogInfo("收到 OAuth 回调请求", zap.String("path", r.URL.Path), zap.String("query", r.URL.RawQuery))
		runtime.EventsEmit(a.ctx, "login-progress", "正在处理授权回调...")
		
		code := r.URL.Query().Get("code")
		if code == "" {
			LogError("OAuth 回调：未获取到授权码")
			errorChan <- fmt.Errorf("未获取到授权码")
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprintf(w, "<html><body><h1>授权失败</h1><p>未获取到授权码</p></body></html>")
			return
		}

		LogInfo("OAuth 回调：获取到授权码", zap.String("code_prefix", code[:min(10, len(code))]+"..."))
		runtime.EventsEmit(a.ctx, "login-progress", "正在换取访问令牌...")

		accessToken, err := a.exchangeCodeForToken(code, config.ClientID, config.ClientSecret, redirectURI)
		if err != nil {
			LogError("OAuth 回调：换取 token 失败", zap.Error(err))
			runtime.EventsEmit(a.ctx, "login-progress", "换取令牌失败")
			errorChan <- fmt.Errorf("换取 access token 失败: %w", err)
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintf(w, "<html><body><h1>授权失败</h1><p>%s</p></body></html>", err.Error())
			return
		}

		runtime.EventsEmit(a.ctx, "login-progress", "正在获取用户信息...")
		userInfo, err := a.fetchGitHubUserInfo(accessToken)
		if err != nil {
			LogError("OAuth 回调：获取用户信息失败", zap.Error(err))
			runtime.EventsEmit(a.ctx, "login-progress", "获取用户信息失败")
			errorChan <- fmt.Errorf("获取用户信息失败: %w", err)
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintf(w, "<html><body><h1>获取用户信息失败</h1><p>%s</p></body></html>", err.Error())
			return
		}

		LogInfo("OAuth 回调：登录成功", zap.String("username", userInfo.Username))
		runtime.EventsEmit(a.ctx, "login-progress", "登录成功！")
		resultChan <- userInfo

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		fmt.Fprintf(w, "<html><body><h1>登录成功！</h1><p>欢迎 <strong>%s</strong>！</p><p>您可以关闭此页面返回应用。</p><script>setTimeout(function(){window.close()},2000);</script></body></html>", userInfo.Username)
	})

	a.oauthServer = &http.Server{
		Addr:    ":8888",
		Handler: mux,
	}

	LogInfo("启动 OAuth 回调服务器", zap.String("addr", ":8888"))
	go func() {
		if err := a.oauthServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			LogError("OAuth 服务器启动失败", zap.Error(err))
			errorChan <- fmt.Errorf("启动 OAuth 服务器失败: %w", err)
		} else {
			LogInfo("OAuth 服务器正常运行")
		}
	}()

	authURL := fmt.Sprintf("https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=%s",
		clientID, redirectURI, config.Scopes)

	LogInfo("准备打开浏览器进行 OAuth 授权", 
		zap.String("url", authURL),
		zap.String("client_id", clientID),
		zap.String("redirect_uri", redirectURI),
		zap.String("scopes", config.Scopes))
	
	runtime.EventsEmit(a.ctx, "login-progress", "正在打开浏览器进行授权...")
	
	// 优先使用 Wails runtime，失败时才使用 browser 包
	browserOpened := false
	if a.ctx != nil {
		LogInfo("使用 Wails runtime 打开浏览器")
		runtime.BrowserOpenURL(a.ctx, authURL)
		LogInfo("runtime.BrowserOpenURL 调用完成")
		browserOpened = true
	} else {
		LogError("应用 context 为 nil，无法使用 runtime 方法")
	}
	
	// 仅在 runtime 方法失败时使用备用方案
	if !browserOpened {
		LogInfo("使用 browser 包打开浏览器（备用方案）")
		if err := browser.OpenURL(authURL); err != nil {
			LogError("browser.OpenURL 失败", zap.Error(err))
		} else {
			LogInfo("browser.OpenURL 成功")
		}
	}

	runtime.EventsEmit(a.ctx, "login-progress", "等待浏览器授权...")
	timeout := time.After(3 * time.Minute)
	
	select {
	case userInfo := <-resultChan:
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		a.oauthServer.Shutdown(ctx)

		if err := a.SaveUserInfo(*userInfo); err != nil {
			return &LoginResponse{
				Success: false,
				Message: fmt.Sprintf("保存用户信息失败: %v", err),
			}, nil
		}

		return &LoginResponse{
			Success:  true,
			Message:  "登录成功",
			UserInfo: userInfo,
		}, nil

	case err := <-errorChan:
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		a.oauthServer.Shutdown(ctx)
		runtime.EventsEmit(a.ctx, "login-progress", "登录失败")
		
		return &LoginResponse{
			Success: false,
			Message: fmt.Sprintf("OAuth 认证失败: %v", err),
		}, nil

	case <-timeout:
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		a.oauthServer.Shutdown(ctx)
		runtime.EventsEmit(a.ctx, "login-progress", "登录超时")
		
		return &LoginResponse{
			Success: false,
			Message: "登录超时",
		}, nil
	}
}

// CancelOAuthLogin 手动终止正在进行的 OAuth 登录流程。
func (a *App) CancelOAuthLogin() error {
	if a.oauthServer != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		return a.oauthServer.Shutdown(ctx)
	}
	return nil
}

// exchangeCodeForToken 向 GitHub 换取访问令牌（Access Token）。
func (a *App) exchangeCodeForToken(code, clientID, clientSecret, redirectURI string) (string, error) {
	LogInfo("开始用授权码换取 access token")
	
	data := url.Values{}
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("code", code)
	data.Set("redirect_uri", redirectURI)

	LogInfo("发送 POST 请求到 GitHub OAuth")
	req, err := http.NewRequest("POST", "https://github.com/login/oauth/access_token", strings.NewReader(data.Encode()))
	if err != nil {
		LogError("创建 OAuth 请求失败", zap.Error(err))
		return "", fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	// 增加超时时间到 30 秒，适应网络较慢的情况
	client := &http.Client{Timeout: 30 * time.Second}
	LogInfo("等待 GitHub OAuth 响应", zap.Duration("timeout", 30*time.Second))
	
	resp, err := client.Do(req)
	if err != nil {
		LogError("OAuth 请求失败", zap.Error(err))
		return "", fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()
	
	LogInfo("收到 OAuth 响应", zap.Int("status_code", resp.StatusCode))

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		LogError("读取 OAuth 响应失败", zap.Error(err))
		return "", fmt.Errorf("读取响应失败: %w", err)
	}

	LogDebug("OAuth 响应内容", zap.String("body", string(body)))

	var result struct {
		AccessToken string `json:"access_token"`
		TokenType   string `json:"token_type"`
		Scope       string `json:"scope"`
		Error       string `json:"error"`
		ErrorDesc   string `json:"error_description"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		LogError("解析 OAuth 响应失败", zap.Error(err))
		return "", fmt.Errorf("解析响应失败: %w", err)
	}

	if result.Error != "" {
		LogError("GitHub 返回 OAuth 错误", 
			zap.String("error", result.Error),
			zap.String("description", result.ErrorDesc))
		return "", fmt.Errorf("GitHub 返回错误: %s - %s", result.Error, result.ErrorDesc)
	}

	if result.AccessToken == "" {
		LogError("未获取到 access token")
		return "", fmt.Errorf("未获取到 access token")
	}

	LogInfo("成功获取 access token", 
		zap.Int("token_length", len(result.AccessToken)),
		zap.String("scope", result.Scope))
		
	return result.AccessToken, nil
}

// fetchGitHubUserInfo 使用 access token 调用 User 接口获取详细的个人资料。
func (a *App) fetchGitHubUserInfo(accessToken string) (*UserInfo, error) {
	LogInfo("获取 GitHub 用户信息")
	
	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		LogError("创建用户信息请求失败", zap.Error(err))
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	// 增加超时时间
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API 返回错误 %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	var githubUser struct {
		Login     string `json:"login"`
		Email     string `json:"email"`
		Name      string `json:"name"`
		AvatarURL string `json:"avatar_url"`
	}

	if err := json.Unmarshal(body, &githubUser); err != nil {
		return nil, fmt.Errorf("解析用户信息失败: %w", err)
	}

	email := githubUser.Email
	if email == "" {
		email, _ = a.fetchGitHubUserEmail(accessToken)
	}

	if email == "" {
		email = fmt.Sprintf("%s@users.noreply.github.com", githubUser.Login)
	}

	return &UserInfo{
		Username:  githubUser.Login,
		Email:     email,
		Token:     accessToken,
		AvatarURL: githubUser.AvatarURL,
	}, nil
}

// fetchGitHubUserEmail 获取 GitHub 用户的主邮箱（Primary Email）。
func (a *App) fetchGitHubUserEmail(accessToken string) (string, error) {
	req, err := http.NewRequest("GET", "https://api.github.com/user/emails", nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("获取邮箱失败: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var emails []struct {
		Email    string `json:"email"`
		Primary  bool   `json:"primary"`
		Verified bool   `json:"verified"`
	}

	if err := json.Unmarshal(body, &emails); err != nil {
		return "", err
	}

	for _, e := range emails {
		if e.Primary && e.Verified {
			return e.Email, nil
		}
	}

	for _, e := range emails {
		if e.Verified {
			return e.Email, nil
		}
	}

	return "", fmt.Errorf("未找到可用邮箱")
}

// SaveUserInfo 将用户信息持久化到磁盘，以便下次启动时保持登录。
func (a *App) SaveUserInfo(userInfo UserInfo) error {
	LogInfo("保存用户信息", zap.String("username", userInfo.Username))
	
	data, err := json.MarshalIndent(userInfo, "", "  ")
	if err != nil {
		LogError("序列化用户信息失败", zap.Error(err))
		return fmt.Errorf("marshal user info: %w", err)
	}
	
	userInfoPath := a.getUserInfoPath()
	if err := os.WriteFile(userInfoPath, data, 0o644); err != nil {
		LogError("写入用户信息失败", zap.String("path", userInfoPath), zap.Error(err))
		return fmt.Errorf("write user info: %w", err)
	}
	
	a.userInfo = &userInfo
	LogInfo("用户信息保存成功", zap.String("path", userInfoPath))
	return nil
}

// LoadUserInfo 从本地磁盘加载用户信息。
func (a *App) LoadUserInfo() (*UserInfo, error) {
	userInfoPath := a.getUserInfoPath()
	LogInfo("加载用户信息", zap.String("path", userInfoPath))
	
	data, err := os.ReadFile(userInfoPath)
	if err != nil {
		if os.IsNotExist(err) {
			LogInfo("用户信息文件不存在")
			return nil, nil
		}
		LogError("读取用户信息失败", zap.Error(err))
		return nil, fmt.Errorf("read user info: %w", err)
	}
	
	var userInfo UserInfo
	if err := json.Unmarshal(data, &userInfo); err != nil {
		LogError("解析用户信息失败", zap.Error(err))
		return nil, fmt.Errorf("unmarshal user info: %w", err)
	}
	
	a.userInfo = &userInfo
	LogInfo("用户信息加载成功", zap.String("username", userInfo.Username))
	return &userInfo, nil
}

// Logout 执行退出操作：删除本地持久化文件并清除内存状态。
func (a *App) Logout() error {
	LogInfo("用户退出登录")
	
	userInfoPath := a.getUserInfoPath()
	if err := os.Remove(userInfoPath); err != nil && !os.IsNotExist(err) {
		LogError("删除用户信息失败", zap.Error(err))
		return fmt.Errorf("remove user info: %w", err)
	}
	a.userInfo = nil
	LogInfo("退出登录成功")
	return nil
}

// getUserInfoPath 计算用户信息存储的绝对路径。
func (a *App) getUserInfoPath() string {
	configDir, err := os.UserConfigDir()
	if err != nil {
		configDir = os.TempDir()
	}
	appConfigDir := filepath.Join(configDir, "green-wall")
	os.MkdirAll(appConfigDir, 0o755)
	return filepath.Join(appConfigDir, "user.json")
}
