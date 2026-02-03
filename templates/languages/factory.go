package languages

import (
	"path/filepath"
	"strings"
)

// GetLanguageTemplate 是一个工厂函数，根据传入的 LanguageType 返回对应的模板实现实例。
func GetLanguageTemplate(lang LanguageType) LanguageTemplate {
	// 归一化处理，确保大小写不敏感
	l := LanguageType(strings.ToLower(string(lang)))
	
	switch l {
	case LangMarkdown:
		return &MarkdownTemplate{}
	case LangJava:
		return &JavaTemplate{}
	case LangPython:
		return &PythonTemplate{}
	case LangJavaScript:
		return &JavaScriptTemplate{}
	case LangTypeScript:
		return &TypeScriptTemplate{}
	case LangGo:
		return &GoTemplate{}
	case LangRust:
		return &RustTemplate{}
	case LangCpp:
		return &CppTemplate{}
	case LangC:
		return &CTemplate{}
	case LangCSharp:
		return &CSharpTemplate{}
	case LangPHP:
		return &PHPTemplate{}
	case LangRuby:
		return &RubyTemplate{}
	case LangSwift:
		return &SwiftTemplate{}
	case LangKotlin:
		return &KotlinTemplate{}
	case LangShell:
		return &ShellTemplate{}
	case LangVue:
		return &VueTemplate{}
	case LangHTML:
		return &HTMLTemplate{}
	case LangCSS:
		return &CSSTemplate{}
	case LangSCSS:
		return &SCSSTemplate{}
	case LangSQL:
		return &SQLTemplate{}
	default:
		// 默认回退到 Markdown
		return &MarkdownTemplate{}
	}
}

// GetAllLanguages 返回所有在系统中注册并支持的语言标识符列表。
func GetAllLanguages() []LanguageType {
	return []LanguageType{
		LangMarkdown,
		LangJava,
		LangPython,
		LangJavaScript,
		LangTypeScript,
		LangGo,
		LangRust,
		LangCpp,
		LangC,
		LangCSharp,
		LangPHP,
		LangRuby,
		LangSwift,
		LangKotlin,
		LangShell,
		LangVue,
		LangHTML,
		LangCSS,
		LangSCSS,
		LangSQL,
	}
}

// GetSupportedLanguages 返回用于前端下拉菜单显示的语言列表。
// 结果包含 label (显示名) 和 value (标识符)。
func GetSupportedLanguages() []map[string]string {
	langs := GetAllLanguages()
	result := make([]map[string]string, len(langs))
	for i, lang := range langs {
		template := GetLanguageTemplate(lang)
		result[i] = map[string]string{
			"value": string(lang),
			"label": template.GetLanguageName(),
		}
	}
	return result
}

// GetCodeFilePath 根据基础路径和模板信息计算源码文件的绝对存储路径。
func GetCodeFilePath(basePath string, lang LanguageType, date string, commitNum int) string {
	template := GetLanguageTemplate(lang)
	filename := template.GetActivityFileName()
	
	// 目前策略：每个语言的所有提交共享同一个活动文件，Git 会记录增量变更。
	
	if basePath == "" {
		return filename
	}
	return filepath.Join(basePath, filename)
}
