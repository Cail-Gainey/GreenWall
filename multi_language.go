package main

import (
	"fmt"
	"strings"

	"go.uber.org/zap"
	"green-wall/templates/languages"
)

// getLanguageCodeBytes 获取每种语言生成的平均代码字节数。
// GitHub 使用 Linguist 工具根据文件字节数（而非代码行数）来统计仓库的语言比例。
// 为了保证生成的仓库在 GitHub 上的语言百分比与用户预设的一致，我们需要知道每种语言模板产生的代码量权重。
func getLanguageCodeBytes(lang string) int {
	// 基于实际生成的代码字节数（精确测量，字节数 ≈ 行数 × 平均每行字符数）
	switch languages.LanguageType(lang) {
	case languages.LangJava:
		return 650 // Java 类定义约 650 字节
	case languages.LangPython:
		return 650 // Python 类定义约 650 字节
	case languages.LangJavaScript:
		return 550 // JavaScript 类约 550 字节
	case languages.LangTypeScript:
		return 950 // TypeScript 类约 950 字节（包含 interface 和 export）
	case languages.LangGo:
		return 850 // Go 结构体约 850 字节（包含 package 和 import）
	case languages.LangRust:
		return 800 // Rust 结构体约 800 字节
	case languages.LangCpp:
		return 750 // C++ 类约 750 字节
	case languages.LangC:
		return 550 // C 结构体约 550 字节
	case languages.LangCSharp:
		return 720 // C# 类约 720 字节
	case languages.LangPHP:
		return 620 // PHP 类约 620 字节
	case languages.LangRuby:
		return 600 // Ruby 类约 600 字节
	case languages.LangSwift:
		return 650 // Swift 结构体约 650 字节
	case languages.LangKotlin:
		return 720 // Kotlin 类约 720 字节
	case languages.LangShell:
		return 450 // Shell 脚本约 450 字节
	case languages.LangVue:
		return 1300 // Vue 组件约 1300 字节（template+script+style）
	case languages.LangHTML:
		return 900 // HTML 页面约 900 字节
	case languages.LangCSS:
		return 700 // CSS 样式约 700 字节
	case languages.LangSCSS:
		return 750 // SCSS 样式约 750 字节
	case languages.LangSQL:
		return 500 // SQL 脚本约 500 字节
	case languages.LangMarkdown:
		return 30  // Markdown 约 30 字节
	default:
		return 500 // 默认值
	}
}

// LanguageConfig 定义了某种语言在混合模式下的目标占比。
type LanguageConfig struct {
	Language string `json:"language"` // 编程语言标识符
	Ratio    int    `json:"ratio"`    // 预期的所占比例 (0-100)
}

// generateMultiLanguageReadme 为多语言混合仓库生成 README.md 内容。
func generateMultiLanguageReadme(repoName string, languageConfigs []LanguageConfig) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("# %s\n\n", repoName))
	sb.WriteString("Generated with [GreenWall](https://github.com/Cail-Gainey/GreenWall).\n\n")
	
	// 如果只有一种语言，降级使用该语言的专属模板
	if len(languageConfigs) == 1 {
		template := languages.GetLanguageTemplate(languages.LanguageType(languageConfigs[0].Language))
		return template.GetReadmeContent(repoName)
	}
	
	// 多语言说明部分
	sb.WriteString("## Languages\n\n")
	sb.WriteString("This repository contains contributions in multiple programming languages:\n\n")
	
	for _, config := range languageConfigs {
		template := languages.GetLanguageTemplate(languages.LanguageType(config.Language))
		sb.WriteString(fmt.Sprintf("- **%s** (%d%%)\n", template.GetLanguageName(), config.Ratio))
	}
	
	sb.WriteString("\n## About\n\n")
	sb.WriteString("This is an automatically generated repository showcasing contributions across different programming languages.\n\n")
	sb.WriteString("Each commit uses a different language based on the configured ratios, creating a diverse and colorful contribution graph.\n\n")
	sb.WriteString("## License\n\nMIT License\n")
	
	return sb.String()
}

// selectLanguageByRatio 采用加权轮询法，根据目标比例为当前的 commit 索引挑选合适的语言。
// 这里的关键是引入了“代码量补偿机制”：
// 因为 GitHub 以字节数统计比例，所以产生代码量大的语言（如 Vue）会占据更多的权重，
// 该算法通过调整分配概率，确保 GitHub 最终统计出来的饼图与用户设置的期望比例一致。
func selectLanguageByRatio(languageConfigs []LanguageConfig, commitIndex int) string {
	if len(languageConfigs) == 0 {
		return "markdown"
	}
	
	if len(languageConfigs) == 1 {
		return languageConfigs[0].Language
	}
	
	// 计算补偿后的分配权重
	type weightedConfig struct {
		language string
		weight   int // 权重 = (期望比例 / 代码量常数)
	}
	
	var weighted []weightedConfig
	totalWeight := 0
	
	for _, config := range languageConfigs {
		if config.Ratio <= 0 {
			continue
		}
		// 补偿公式：权重 = 目标比例 * 10000 / 每提交平均字节数
		// 字节数越大的语言，其分配到的提交频率越高，从而在总量上占据正确的字节百分比。
		bytes := getLanguageCodeBytes(config.Language)
		weight := (config.Ratio * 10000) / bytes
		
		if weight < 1 {
			weight = 1
		}
		
		weighted = append(weighted, weightedConfig{
			language: config.Language,
			weight:   weight,
		})
		totalWeight += weight
	}
	
	if totalWeight == 0 || len(weighted) == 0 {
		return languageConfigs[0].Language
	}
	
	// 轮询定位
	position := commitIndex % totalWeight
	cumulative := 0
	for _, wc := range weighted {
		cumulative += wc.weight
		if position < cumulative {
			return wc.language
		}
	}
	
	return weighted[0].language
}

// validateLanguageConfigs 检查传入的多语言配置是否合法。
func validateLanguageConfigs(languageConfigs []LanguageConfig) error {
	if len(languageConfigs) == 0 {
		return fmt.Errorf("至少需要配置一种语言")
	}
	
	totalRatio := 0
	for i, config := range languageConfigs {
		if config.Language == "" {
			return fmt.Errorf("语言配置[%d]: 语言类型不能为空", i)
		}
		
		if config.Ratio < 0 {
			return fmt.Errorf("语言配置[%d]: 比例不能为负数", i)
		}
		
		if config.Ratio > 100 {
			return fmt.Errorf("语言配置[%d]: 单个语言比例不能超过 100%%", i)
		}
		
		totalRatio += config.Ratio
	}
	
	if totalRatio == 0 {
		return fmt.Errorf("语言比例总和不能为 0")
	}
	
	return nil
}

// normalizeLanguageConfigs 对语言比例进行标准化处理，使其总和接近 100。
func normalizeLanguageConfigs(languageConfigs []LanguageConfig) []LanguageConfig {
	if len(languageConfigs) == 0 {
		return []LanguageConfig{{Language: "markdown", Ratio: 100}}
	}
	
	totalRatio := 0
	for _, config := range languageConfigs {
		totalRatio += config.Ratio
	}
	
	if totalRatio >= 95 && totalRatio <= 105 {
		return languageConfigs
	}
	
	normalized := make([]LanguageConfig, len(languageConfigs))
	for i, config := range languageConfigs {
		normalized[i] = LanguageConfig{
			Language: config.Language,
			Ratio:    (config.Ratio * 100) / totalRatio,
		}
	}
	
	return normalized
}

// mergeAdditionalFiles 聚合多语言模板产生的所有额外文件。
// 如果不同语言对同一个路径产生了冲突文件，该方法会自动为后来的语言文件添加后缀，以防相互覆盖。
func mergeAdditionalFiles(repoName string, languageConfigs []LanguageConfig) map[string]string {
	allFiles := make(map[string]string)
	fileOwners := make(map[string]string) // 记录文件归属
	
	for _, langConfig := range languageConfigs {
		template := languages.GetLanguageTemplate(languages.LanguageType(langConfig.Language))
		files := template.GetAdditionalFiles(repoName)
		
		for filePath, content := range files {
			if existingContent, exists := allFiles[filePath]; exists {
				if existingContent == content {
					continue
				}
				
				// 路径冲突：为后来的文件分配带语言标识符的后缀名
				owner := fileOwners[filePath]
				newPath := fmt.Sprintf("%s.%s", filePath, langConfig.Language)
				allFiles[newPath] = content
				fileOwners[newPath] = langConfig.Language
				
				LogInfo("检测到文件路径冲突，进行重命名",
					zap.String("original", filePath),
					zap.String("owner", owner),
					zap.String("new_file", newPath),
					zap.String("new_owner", langConfig.Language))
			} else {
				allFiles[filePath] = content
				fileOwners[filePath] = langConfig.Language
			}
		}
	}
	
	return allFiles
}
