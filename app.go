// app.go 包含前端 Wails 调用的后端核心逻辑绑定。
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"go.uber.org/zap"
	"green-wall/templates/languages"
)

// App 结构体定义了应用程序的后端状态和 Wails 绑定方法。
type App struct {
	ctx          context.Context
	repoBasePath string
	gitPath      string       // 自定义 git 路径，为空则使用系统默认路径
	userInfo     *UserInfo    // 当前登录的 GitHub 用户信息
	oauthServer  *http.Server // 用于接收 OAuth 回调的临时 HTTP 服务器
}

// NewApp 创建并返回一个新的 App 实例。
func NewApp() *App {
	return &App{
		repoBasePath: filepath.Join(os.TempDir(), "green-wall"),
	}
}

// startup 是在应用启动时由 Wails 自动调用的钩子函数。
// 它负责保存应用上下文，以便后续调用前端运行时方法。
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet 是一个演示用的问候方法。
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// GetSupportedLanguagesAPI 返回当前支持的所有编程语言列表，用于前端下拉选择。
func (a *App) GetSupportedLanguagesAPI() []map[string]string {
	return languages.GetSupportedLanguages()
}

// ContributionDay 代表单日的贡献量。
type ContributionDay struct {
	Date  string `json:"date"`  // 格式: YYYY-MM-DD
	Count int    `json:"count"` // 提交次数
}

// GenerateRepoRequest 包含生成 Git 仓库所需的所有元数据。
type GenerateRepoRequest struct {
	Year            int               `json:"year"`           // 目标年份
	GithubUsername  string            `json:"githubUsername"` // 提交者的 GitHub 用户名
	GithubEmail     string            `json:"githubEmail"`    // 提交者的 GitHub 邮箱
	RepoName        string            `json:"repoName"`       // 目标仓库名
	Contributions   []ContributionDay `json:"contributions"`  // 包含每一天提交数的数组
	Language        string            `json:"language"`        // 默认编程语言(单语言模式)
	LanguageConfigs []LanguageConfig  `json:"languageConfigs"` // 多语言配置(多语言模式)
	MultiLanguage   bool              `json:"multiLanguage"`   // 是否启用多语言混合生成
}

// GenerateRepoResponse 返回生成结果。
type GenerateRepoResponse struct {
	RepoPath    string `json:"repoPath"`    // 仓库在本地的临时存储路径
	CommitCount int    `json:"commitCount"` // 成功生成的总提交数
}

var repoNameSanitiser = regexp.MustCompile(`[^a-zA-Z0-9._-]+`)

// CheckGitInstalledResponse 表示 Git 检测结果。
type CheckGitInstalledResponse struct {
	Installed bool   `json:"installed"` // 是否已安装
	Version   string `json:"version"`   // Git 版本信息
}

// SetGitPathRequest 表示设置自定义 Git 路径的请求。
type SetGitPathRequest struct {
	GitPath string `json:"gitPath"` // Git 可执行文件路径
}

// SetGitPathResponse 表示设置 Git 路径的结果。
type SetGitPathResponse struct {
	Success bool   `json:"success"` // 是否设置成功
	Message string `json:"message"` // 状态信息或错误提示
	Version string `json:"version"` // 设置后的 Git 版本
}

// CheckGitInstalled checks if Git is installed on the system
func (a *App) CheckGitInstalled() (*CheckGitInstalledResponse, error) {
	gitCmd := a.getGitCommand()
	LogInfo("检查Git安装状态", zap.String("git_command", gitCmd))
	
	cmd := exec.Command(gitCmd, "--version")
	output, err := cmd.CombinedOutput()
	if err != nil {
		LogWarn("Git未安装或无法访问", zap.Error(err))
		return &CheckGitInstalledResponse{
			Installed: false,
			Version:   "",
		}, nil
	}
	
	version := strings.TrimSpace(string(output))
	LogInfo("Git已安装", zap.String("version", version))
	return &CheckGitInstalledResponse{
		Installed: true,
		Version:   version,
	}, nil
}

// GetGitPath 获取当前设置的Git路径
func (a *App) GetGitPath() (string, error) {
	return a.gitPath, nil
}

// SetGitPath allows the user to set a custom git path
func (a *App) SetGitPath(req SetGitPathRequest) (*SetGitPathResponse, error) {
	gitPath := strings.TrimSpace(req.GitPath)
	LogInfo("设置Git路径", zap.String("path", gitPath))
	
	// 如果留空，使用系统默认路径
	if gitPath == "" {
		a.gitPath = ""
		LogInfo("重置为系统默认Git路径")
		return &SetGitPathResponse{
			Success: true,
			Message: "已重置为使用系统默认git路径",
			Version: "",
		}, nil
	}
	
	// 检查路径是否存在
	if _, err := os.Stat(gitPath); os.IsNotExist(err) {
		LogWarn("Git路径不存在", zap.String("path", gitPath))
		return &SetGitPathResponse{
			Success: false,
			Message: "指定的路径不存在",
			Version: "",
		}, nil
	}
	
	// 验证是否是有效的git可执行文件
	cmd := exec.Command(gitPath, "--version")
	output, err := cmd.CombinedOutput()
	if err != nil {
		LogError("无效的Git可执行文件", zap.String("path", gitPath), zap.Error(err))
		return &SetGitPathResponse{
			Success: false,
			Message: "指定的路径不是有效的git可执行文件",
			Version: "",
		}, nil
	}
	
	// 设置成功
	a.gitPath = gitPath
	version := strings.TrimSpace(string(output))
	LogInfo("Git路径设置成功", zap.String("path", gitPath), zap.String("version", version))
	
	return &SetGitPathResponse{
		Success: true,
		Message: "Git路径设置成功",
		Version: version,
	}, nil
}

// getGitCommand 获取实际使用的 Git 命令名或路径。
func (a *App) getGitCommand() string {
	if a.gitPath != "" {
		return a.gitPath
	}
	return "git"
}

// GenerateRepo 是核心方法，它会根据前端提供的贡献图数据，在本地生成一个具有对应历史记录的 Git 仓库。
// 该方法使用了 git fast-import 技术以实现极高性能的历史注入。
func (a *App) GenerateRepo(req GenerateRepoRequest) (*GenerateRepoResponse, error) {
	// 处理语言配置
	var languageConfigs []LanguageConfig
	if req.MultiLanguage && len(req.LanguageConfigs) > 0 {
		// 多语言模式
		languageConfigs = req.LanguageConfigs
		
		// 验证语言配置
		if err := validateLanguageConfigs(languageConfigs); err != nil {
			LogError("语言配置验证失败", zap.Error(err))
			return nil, fmt.Errorf("invalid language configs: %w", err)
		}
		
		// 标准化语言配置
		languageConfigs = normalizeLanguageConfigs(languageConfigs)
		
		LogInfo("开始生成仓库(多语言模式)", 
			zap.Int("contributions_count", len(req.Contributions)),
			zap.String("username", req.GithubUsername),
			zap.Int("year", req.Year),
			zap.Int("language_count", len(languageConfigs)))
	} else {
		// 单语言模式(向后兼容)
		language := req.Language
		if language == "" {
			language = "markdown"
		}
		languageConfigs = []LanguageConfig{{Language: language, Ratio: 100}}
		LogInfo("开始生成仓库(单语言模式)", 
			zap.Int("contributions_count", len(req.Contributions)),
			zap.String("username", req.GithubUsername),
			zap.Int("year", req.Year),
			zap.String("language", language))
	}
	
	if len(req.Contributions) == 0 {
		LogError("生成仓库失败：无贡献数据")
		return nil, fmt.Errorf("no contributions supplied")
	}

	totalRequestedCommits := 0
	for _, c := range req.Contributions {
		if c.Count < 0 {
			LogError("无效的贡献计数", zap.String("date", c.Date), zap.Int("count", c.Count))
			return nil, fmt.Errorf("invalid contribution count for %s: %d", c.Date, c.Count)
		}
		totalRequestedCommits += c.Count
	}
	if totalRequestedCommits == 0 {
		LogWarn("生成仓库失败：无提交需要生成")
		return nil, fmt.Errorf("no commits to generate")
	}

	LogInfo("计算提交总数", zap.Int("total_commits", totalRequestedCommits))

	username := strings.TrimSpace(req.GithubUsername)
	if username == "" {
		username = "Cail Gainey"
	}
	email := strings.TrimSpace(req.GithubEmail)
	if email == "" {
		email = "cailgainey@foxmail.com"
	}

	if err := os.MkdirAll(a.repoBasePath, 0o755); err != nil {
		return nil, fmt.Errorf("create repo base directory: %w", err)
	}

	repoName := strings.TrimSpace(req.RepoName)
	if repoName == "" {
		repoName = username
		if req.Year > 0 {
			repoName = fmt.Sprintf("%s-%d", repoName, req.Year)
		}
	}
	repoName = sanitiseRepoName(repoName)
	if repoName == "" {
		repoName = "contributions"
	}

	repoPath, err := os.MkdirTemp(a.repoBasePath, repoName+"-")
	if err != nil {
		LogError("创建仓库目录失败", zap.Error(err))
		return nil, fmt.Errorf("create repo directory: %w", err)
	}

	LogInfo("创建仓库目录", zap.String("path", repoPath), zap.String("repo_name", repoName))

	// 生成多语言README
	readmePath := filepath.Join(repoPath, "README.md")
	readmeContent := generateMultiLanguageReadme(repoName, languageConfigs)
	if err := os.WriteFile(readmePath, []byte(readmeContent), 0o644); err != nil {
		LogError("写入README失败", zap.Error(err))
		return nil, fmt.Errorf("write README: %w", err)
	}
	
	// 创建所有语言的额外文件
	allAdditionalFiles := mergeAdditionalFiles(repoName, languageConfigs)
	
	for filePath, content := range allAdditionalFiles {
		fullPath := filepath.Join(repoPath, filePath)
		// 确保目录存在
		if err := os.MkdirAll(filepath.Dir(fullPath), 0o755); err != nil {
			LogError("创建目录失败", zap.String("path", filepath.Dir(fullPath)), zap.Error(err))
			return nil, fmt.Errorf("create directory: %w", err)
		}
		if err := os.WriteFile(fullPath, []byte(content), 0o644); err != nil {
			LogError("写入文件失败", zap.String("path", fullPath), zap.Error(err))
			return nil, fmt.Errorf("write file %s: %w", filePath, err)
		}
		LogInfo("创建额外文件", zap.String("file", filePath))
	}

	LogInfo("初始化Git仓库", zap.String("username", username), zap.String("email", email))
	if err := a.runGitCommand(repoPath, "init"); err != nil {
		return nil, err
	}
	if err := a.runGitCommand(repoPath, "config", "user.name", username); err != nil {
		return nil, err
	}
	if err := a.runGitCommand(repoPath, "config", "user.email", email); err != nil {
		return nil, err
	}

    // 优化：使用git fast-import以避免为每个提交启动一个进程。
    // 同时禁用此仓库的慢速功能。
    _ = a.runGitCommand(repoPath, "config", "commit.gpgsign", "false")
    _ = a.runGitCommand(repoPath, "config", "gc.auto", "0")
    _ = a.runGitCommand(repoPath, "config", "core.autocrlf", "false")
    _ = a.runGitCommand(repoPath, "config", "core.fsync", "none")

    // 按日期升序排序贡献以生成时间线历史
    contribs := make([]ContributionDay, 0, len(req.Contributions))
    for _, c := range req.Contributions {
        if c.Count > 0 {
            contribs = append(contribs, c)
        }
    }
    sort.Slice(contribs, func(i, j int) bool { return contribs[i].Date < contribs[j].Date })

    // 构建fast-import流
    var stream bytes.Buffer
    // 创建README blob并标记它
    fmt.Fprintf(&stream, "blob\nmark :1\n")
    fmt.Fprintf(&stream, "data %d\n%s\n", len(readmeContent), readmeContent)

    nextMark := 2
    totalCommits := 0
    branch := "refs/heads/main"

    for _, day := range contribs {
        parsedDate, err := time.Parse("2006-01-02", day.Date)
        if err != nil {
            return nil, fmt.Errorf("invalid date %q: %w", day.Date, err)
        }
        for i := 0; i < day.Count; i++ {
            // 根据比例选择语言
            selectedLang := selectLanguageByRatio(languageConfigs, totalCommits)
            template := languages.GetLanguageTemplate(languages.LanguageType(selectedLang))
            
            // 使用语言模板生成代码内容
            codeContent := template.GenerateCode(day.Date, i+1, day.Count)

            // 发射代码文件的blob
            fmt.Fprintf(&stream, "blob\nmark :%d\n", nextMark)
            fmt.Fprintf(&stream, "data %d\n", len(codeContent))
            stream.WriteString(codeContent)
            stream.WriteString("\n")

            // 获取代码文件路径（相对于仓库根目录）
            codeFilePath := languages.GetCodeFilePath("", languages.LanguageType(selectedLang), day.Date, i+1)
            // 只需要相对路径，去掉开头的路径分隔符
            codeFilePath = strings.TrimPrefix(codeFilePath, string(filepath.Separator))

            // 发射提交，指向README (:1)和代码文件 (:nextMark)
            commitTime := parsedDate.Add(time.Duration(i) * time.Second)
            secs := commitTime.Unix()
            tz := commitTime.Format("-0700")
            msg := fmt.Sprintf("Contribution on %s (%d/%d)", day.Date, i+1, day.Count)
            fmt.Fprintf(&stream, "commit %s\n", branch)
            fmt.Fprintf(&stream, "author %s <%s> %d %s\n", username, email, secs, tz)
            fmt.Fprintf(&stream, "committer %s <%s> %d %s\n", username, email, secs, tz)
            fmt.Fprintf(&stream, "data %d\n%s\n", len(msg), msg)
            fmt.Fprintf(&stream, "M 100644 :1 %s\n", filepath.Base(readmePath))
            fmt.Fprintf(&stream, "M 100644 :%d %s\n", nextMark, codeFilePath)

            nextMark++
            totalCommits++
        }
    }
    stream.WriteString("done\n")

    // 将流发送到fast-import
    if totalCommits > 0 {
        if err := a.runGitFastImport(repoPath, &stream); err != nil {
            return nil, fmt.Errorf("fast-import failed: %w", err)
        }
        // 更新工作目录到生成的分支，为用户方便
        _ = a.runGitCommand(repoPath, "checkout", "-f", "main")
    }

	/* 
	if err := openDirectory(repoPath); err != nil {
		return nil, fmt.Errorf("open repo directory: %w", err)
	}
	*/

	LogInfo("仓库生成成功", 
		zap.String("repo_path", repoPath),
		zap.Int("commit_count", totalCommits),
		zap.String("repo_name", repoName))
	
	return &GenerateRepoResponse{
		RepoPath:    repoPath,
		CommitCount: totalCommits,
	}, nil
}

// ExportContributionsRequest 定义导出请求。
type ExportContributionsRequest struct {
	Contributions []ContributionDay `json:"contributions"`
}

// ExportContributionsResponse 定义导出结果。
type ExportContributionsResponse struct {
	Success  bool   `json:"success"`  // 是否成功
	Message  string `json:"message"`  // 详细信息
	FilePath string `json:"filePath"` // 导出的文件路径
}

// ExportContributions 将当前的贡献图数据导出为 JSON 文件。
func (a *App) ExportContributions(req ExportContributionsRequest) (*ExportContributionsResponse, error) {
	LogInfo("开始导出贡献数据", zap.Int("count", len(req.Contributions)))
	
	data, err := json.MarshalIndent(req.Contributions, "", "  ")
	if err != nil {
		LogError("序列化贡献数据失败", zap.Error(err))
		return nil, fmt.Errorf("marshal contributions: %w", err)
	}

	// 使用对话框让用户选择保存位置
	filePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "导出贡献数据",
		DefaultFilename: "contributions.json",
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON Files (*.json)", Pattern: "*.json"},
			{DisplayName: "All Files (*.*)", Pattern: "*.*"},
		},
	})

	if err != nil {
		LogError("保存文件对话框失败", zap.Error(err))
		return nil, fmt.Errorf("save file dialog: %w", err)
	}

	// 用户取消了对话框
	if filePath == "" {
		LogInfo("用户取消了导出操作")
		return &ExportContributionsResponse{
			Success: false,
			Message: "用户取消了导出操作",
		}, nil
	}

	if err := os.WriteFile(filePath, data, 0o644); err != nil {
		LogError("写入文件失败", zap.String("path", filePath), zap.Error(err))
		return nil, fmt.Errorf("write file: %w", err)
	}

	LogInfo("导出贡献数据成功", zap.String("path", filePath), zap.Int("size", len(data)))
	return &ExportContributionsResponse{
		Success:  true,
		Message:  "导出成功",
		FilePath: filePath,
	}, nil
}

// ImportContributionsResponse 定义导入结果。
type ImportContributionsResponse struct {
	Contributions []ContributionDay `json:"contributions"` // 导入的贡献数据
}

// ImportContributions 从本地 JSON 文件导入贡献图数据。
func (a *App) ImportContributions() (*ImportContributionsResponse, error) {
	LogInfo("开始导入贡献数据")
	
	// 使用对话框让用户选择导入文件
	filePath, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "导入贡献数据",
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON 文件 (*.json)", Pattern: "*.json"},
		},
	})
	if err != nil {
		LogError("打开文件对话框失败", zap.Error(err))
		return nil, fmt.Errorf("open file dialog: %w", err)
	}
	if filePath == "" {
		LogInfo("用户取消了导入操作")
		return nil, fmt.Errorf("import cancelled")
	}

	LogInfo("读取导入文件", zap.String("path", filePath))
	data, err := os.ReadFile(filePath)
	if err != nil {
		LogError("读取文件失败", zap.String("path", filePath), zap.Error(err))
		return nil, fmt.Errorf("read contributions file: %w", err)
	}

	var contributions []ContributionDay
	if err := json.Unmarshal(data, &contributions); err != nil {
		LogError("解析JSON失败", zap.Error(err))
		return nil, fmt.Errorf("unmarshal contributions: %w", err)
	}

	LogInfo("导入贡献数据成功", zap.Int("count", len(contributions)))
	return &ImportContributionsResponse{Contributions: contributions}, nil
}

// sanitiseRepoName 清理仓库名称，使其符合 Git 和 GitHub 的命名规范。
func sanitiseRepoName(input string) string {
	input = strings.TrimSpace(input)
	if input == "" {
		return ""
	}
	input = repoNameSanitiser.ReplaceAllString(input, "-")
	input = strings.Trim(input, "-")
	if input == "" {
		return ""
	}
	if len(input) > 64 {
		input = input[:64]
	}
	return input
}

// runGitCommand 在指定目录执行 Git 命令。
func (a *App) runGitCommand(dir string, args ...string) error {
	gitCmd := a.getGitCommand()
	cmd := exec.Command(gitCmd, args...)
	cmd.Dir = dir
	configureCommand(cmd, true)

	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("git %s: %w (%s)", strings.Join(args, " "), err, strings.TrimSpace(stderr.String()))
	}

	return nil
}

// runGitFastImport 通过标准输入运行 `git fast-import` 命令，直接注入提交历史。
func (a *App) runGitFastImport(dir string, r *bytes.Buffer) error {
    gitCmd := a.getGitCommand()
    cmd := exec.Command(gitCmd, "fast-import", "--quiet")
    cmd.Dir = dir
    configureCommand(cmd, true)
    cmd.Stdin = r
    var stderr bytes.Buffer
    cmd.Stderr = &stderr
    if err := cmd.Run(); err != nil {
        return fmt.Errorf("git fast-import: %w (%s)", err, strings.TrimSpace(stderr.String()))
    }
    return nil
}
