package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"go.uber.org/zap"
)

// GitHubRepo 表示从 GitHub API 返回的仓库简要信息。
type GitHubRepo struct {
	Name          string `json:"name"`           // 仓库短名
	FullName      string `json:"full_name"`      // 包含所有者的完整名称 (owner/repo)
	Private       bool   `json:"private"`        // 是否为私有仓库
	HTMLURL       string `json:"html_url"`       // 仓库的网页地址
	DefaultBranch string `json:"default_branch"` // 默认分支名
}

// GitHubBranch 表示从 GitHub API 返回的分支信息。
type GitHubBranch struct {
	Name string `json:"name"` // 分支名称
}

// CreateRepoRequest 定义了在 GitHub 上创建新仓库的请求负载。
type CreateRepoRequest struct {
	Name        string `json:"name"`        // 仓库名
	Description string `json:"description"` // 描述
	Private     bool   `json:"private"`     // 是否私有
	AutoInit    bool   `json:"auto_init"`   // 是否自动初始化(添加 README)
}

// PushRepoRequest 包含将本地仓库推送到远程的所有必要信息。
type PushRepoRequest struct {
	RepoPath    string `json:"repoPath"`    // 本地临时仓库路径
	RepoName    string `json:"repoName"`    // 远程仓库名
	Branch      string `json:"branch"`      // 目标推送分支
	IsNewRepo   bool   `json:"isNewRepo"`   // 是否为新创建的仓库
	IsPrivate   bool   `json:"isPrivate"`   // (仅新建)是否设为私有
	ForcePush   bool   `json:"forcePush"`   // 是否强制推送(覆盖远程历史)
	CommitCount int    `json:"commitCount"` // 提交总数(用于统计显示)
}

// PushRepoResponse 定义了推送操作的执行结果。
type PushRepoResponse struct {
	Success bool   `json:"success"` // 是否成功
	Message string `json:"message"` // 反馈信息
	RepoURL string `json:"repoUrl"` // 仓库地址
}

// GetUserRepos 获取当前登录用户在 GitHub 上的所有仓库列表。
func (a *App) GetUserRepos() ([]GitHubRepo, error) {
	LogInfo("获取用户仓库列表")

	if a.userInfo == nil || a.userInfo.Token == "" {
		LogError("获取仓库列表失败：用户未登录")
		return nil, fmt.Errorf("未登录")
	}

	req, err := http.NewRequest("GET", "https://api.github.com/user/repos?per_page=100", nil)
	if err != nil {
		LogError("创建请求失败", zap.Error(err))
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+a.userInfo.Token)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		LogError("请求 GitHub API 失败", zap.Error(err))
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		LogError("GitHub API 返回错误", zap.Int("status_code", resp.StatusCode), zap.String("response", string(body)))
		return nil, fmt.Errorf("GitHub API 返回错误 %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		LogError("读取响应失败", zap.Error(err))
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	var repos []GitHubRepo
	if err := json.Unmarshal(body, &repos); err != nil {
		LogError("解析仓库列表失败", zap.Error(err))
		return nil, fmt.Errorf("解析仓库列表失败: %w", err)
	}

	LogInfo("获取仓库列表成功", zap.Int("count", len(repos)))
	return repos, nil
}

// GetRepoBranches 获取指定仓库的所有分支列表。
func (a *App) GetRepoBranches(owner, repo string) ([]string, error) {
	LogInfo("获取仓库分支列表", zap.String("owner", owner), zap.String("repo", repo))

	if a.userInfo == nil || a.userInfo.Token == "" {
		return nil, fmt.Errorf("未登录")
	}

	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/branches?per_page=100", owner, repo)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+a.userInfo.Token)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API 返回错误 %d: %s", resp.StatusCode, string(body))
	}

	var branches []GitHubBranch
	if err := json.NewDecoder(resp.Body).Decode(&branches); err != nil {
		return nil, fmt.Errorf("解析分支列表失败: %w", err)
	}

	var branchNames []string
	for _, b := range branches {
		branchNames = append(branchNames, b.Name)
	}

	LogInfo("获取分支列表成功", zap.Int("count", len(branchNames)))
	return branchNames, nil
}

// VerifyGitHubToken 验证当前保存的 OAuth Token 是否有效，并检查是否具备必要的权限（Scopes）。
func (a *App) VerifyGitHubToken() error {
	if a.userInfo == nil || a.userInfo.Token == "" {
		return fmt.Errorf("未登录")
	}

	LogInfo("验证 GitHub token")
	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		return fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+a.userInfo.Token)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode == 401 {
		LogError("Token 无效或已过期")
		return fmt.Errorf("token 无效或已过期")
	}

	if resp.StatusCode == 403 {
		LogError("Token 权限不足", zap.String("response", string(body)))
		return fmt.Errorf("token 权限不足")
	}

	if resp.StatusCode != 200 {
		LogError("Token 验证失败", zap.Int("status_code", resp.StatusCode), zap.String("response", string(body)))
		return fmt.Errorf("验证失败: %d", resp.StatusCode)
	}

	LogInfo("Token 验证成功")

	// 检查 token 的 scopes
	scopes := resp.Header.Get("X-OAuth-Scopes")
	LogInfo("Token 权限", zap.String("scopes", scopes))

	// 检查是否有 repo 权限
	if !strings.Contains(scopes, "repo") && !strings.Contains(scopes, "public_repo") {
		LogWarn("Token 缺少 repo 权限", zap.String("scopes", scopes))
		return fmt.Errorf("token 缺少 'repo' 权限，无法操作仓库。")
	}

	return nil
}

// CreateGitHubRepo 调用 GitHub API 在用户账户下创建一个新的代码仓库。
func (a *App) CreateGitHubRepo(name string, isPrivate bool) (*GitHubRepo, error) {
	LogInfo("开始创建 GitHub 仓库", zap.String("name", name), zap.Bool("private", isPrivate))

	if a.userInfo == nil || a.userInfo.Token == "" {
		LogError("创建仓库失败：用户未登录")
		return nil, fmt.Errorf("未登录")
	}

	reqBody := CreateRepoRequest{
		Name:        name,
		Description: "Generated with GreenWall",
		Private:     isPrivate,
		AutoInit:    false,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("序列化请求失败: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.github.com/user/repos", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+a.userInfo.Token)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "GreenWall-App")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	if resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("创建仓库失败 %d: %s", resp.StatusCode, string(body))
	}

	var repo GitHubRepo
	if err := json.Unmarshal(body, &repo); err != nil {
		return nil, fmt.Errorf("解析仓库信息失败: %w", err)
	}

	LogInfo("仓库创建成功", zap.String("url", repo.HTMLURL), zap.String("name", repo.Name))
	return &repo, nil
}

// PushToGitHub 负责将本地生成的提交历史推送到 GitHub 远程仓库。
// 该方法包含完整的生命周期管理：验证、远程地址配置、多重推送尝试(含强制覆盖逻辑)。
func (a *App) PushToGitHub(req PushRepoRequest) (*PushRepoResponse, error) {
	LogInfo("开始推送流程",
		zap.String("repo_name", req.RepoName),
		zap.Bool("is_new", req.IsNewRepo),
		zap.Bool("private", req.IsPrivate),
		zap.Bool("force", req.ForcePush),
		zap.Int("commits", req.CommitCount))

	if a.userInfo == nil || a.userInfo.Token == "" {
		return &PushRepoResponse{Success: false, Message: "未登录"}, nil
	}

	// 1. 验证 Token 有效性
	if err := a.VerifyGitHubToken(); err != nil {
		return &PushRepoResponse{Success: false, Message: fmt.Sprintf("Token 验证失败: %v", err)}, nil
	}

	// 2. 准备仓库地址
	var repoURL string
	var actualRepoName string
	if req.IsNewRepo {
		repo, err := a.CreateGitHubRepo(req.RepoName, req.IsPrivate)
		if err != nil {
			return &PushRepoResponse{Success: false, Message: fmt.Sprintf("创建 GitHub 仓库失败: %v", err)}, nil
		}
		repoURL = repo.HTMLURL
		actualRepoName = repo.Name
	} else {
		actualRepoName = req.RepoName
		if strings.Contains(actualRepoName, "/") {
			repoURL = fmt.Sprintf("https://github.com/%s", actualRepoName)
		} else {
			repoURL = fmt.Sprintf("https://github.com/%s/%s", a.userInfo.Username, actualRepoName)
		}
	}

	// 3. 配置 Git 远程地址 (使用 Token 注入以实现静默推送)
	var remoteURL string
	if strings.Contains(actualRepoName, "/") {
		remoteURL = fmt.Sprintf("https://%s@github.com/%s.git", a.userInfo.Token, actualRepoName)
	} else {
		remoteURL = fmt.Sprintf("https://%s@github.com/%s/%s.git", a.userInfo.Token, a.userInfo.Username, actualRepoName)
	}

	if err := a.runGitCommand(req.RepoPath, "remote", "add", "origin", remoteURL); err != nil {
		a.runGitCommand(req.RepoPath, "remote", "set-url", "origin", remoteURL)
	}

	targetBranch := req.Branch
	if targetBranch == "" {
		targetBranch = "main"
	}

	// 4. 执行推送
	var pushArgs []string
	if req.ForcePush {
		// 强制覆盖模式：使用显式 refspec (本地 main -> 远程 target)
		pushArgs = []string{"push", "-f", "origin", fmt.Sprintf("main:%s", targetBranch)}
		runtime.EventsEmit(a.ctx, "push-progress", fmt.Sprintf("🚀 正在彻底覆盖远程 %s 分支...", targetBranch))
	} else {
		// 普通推送
		pushArgs = []string{"push", "-u", "origin", fmt.Sprintf("main:%s", targetBranch)}
		runtime.EventsEmit(a.ctx, "push-progress", fmt.Sprintf("正在推送到 %s 分支...", targetBranch))
	}

	if err := a.runGitCommand(req.RepoPath, pushArgs...); err != nil {
		// 5. 强制推送的灾难恢复逻辑
		if req.ForcePush {
			LogInfo("初次强推受阻，尝试删除重建策略", zap.String("branch", targetBranch))
			runtime.EventsEmit(a.ctx, "push-progress", "正在尝试物理删除远程分支以强制重置...")
			
			// 尝试删除远程分支后重新推送
			a.runGitCommand(req.RepoPath, "push", "origin", "--delete", targetBranch)
			if err := a.runGitCommand(req.RepoPath, "push", "-u", "origin", fmt.Sprintf("main:%s", targetBranch)); err != nil {
				LogError("所有推送尝试均失败", zap.Error(err))
				os.RemoveAll(req.RepoPath)
				return &PushRepoResponse{Success: false, Message: "强制推送失败，请检查分支保护设置"}, nil
			}
		} else {
			os.RemoveAll(req.RepoPath)
			return &PushRepoResponse{Success: false, Message: "推送失败，如果远程已有内容请勾选强制推送"}, nil
		}
	}

	// 清理并返回成功
	os.RemoveAll(req.RepoPath)
	return &PushRepoResponse{
		Success: true,
		Message: fmt.Sprintf("成功推送 %d 个提交到 %s", req.CommitCount, actualRepoName),
		RepoURL: repoURL,
	}, nil
}
