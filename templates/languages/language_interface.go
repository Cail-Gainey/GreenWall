// languages 包定义了所有受支持编程语言的代码生成逻辑和模板。
package languages

// LanguageType 强类型定义编程语言标识符。
type LanguageType string

const (
	LangMarkdown   LanguageType = "markdown"
	LangJava       LanguageType = "java"
	LangPython     LanguageType = "python"
	LangJavaScript LanguageType = "javascript"
	LangTypeScript LanguageType = "typescript"
	LangGo         LanguageType = "go"
	LangRust       LanguageType = "rust"
	LangCpp        LanguageType = "cpp"
	LangC          LanguageType = "c"
	LangCSharp     LanguageType = "csharp"
	LangPHP        LanguageType = "php"
	LangRuby       LanguageType = "ruby"
	LangSwift      LanguageType = "swift"
	LangKotlin     LanguageType = "kotlin"
	LangShell      LanguageType = "shell"
	LangVue        LanguageType = "vue"
	LangHTML       LanguageType = "html"
	LangCSS        LanguageType = "css"
	LangSCSS       LanguageType = "scss"
	LangSQL        LanguageType = "sql"
)

// LanguageTemplate 接口定义了每种编程语言模板必须实现的方法。
// backend 正是通过该接口来生成不同语言的 commit 负载和仓库结构。
type LanguageTemplate interface {
	// GetFileExtension 返回该语言的标准源码文件后缀（如 ".js", ".go"）。
	GetFileExtension() string
	
	// GetActivityFileName 返回该语言用于记录贡献活动的主文件名。
	GetActivityFileName() string
	
	// GenerateCode 根据日期和提交计数生成模拟的源代码内容。
	GenerateCode(date string, commitNum int, totalCommits int) string
	
	// GetReadmeContent 根据仓库名生成特定语言风格的 README 内容。
	GetReadmeContent(repoName string) string
	
	// GetAdditionalFiles 返回该语言环境所需的额外支撑文件（如 package.json, go.mod）。
	GetAdditionalFiles(repoName string) map[string]string
	
	// GetLanguageName 返回用于前端显示的友好语言名称（如 "Java", "Go"）。
	GetLanguageName() string
}
