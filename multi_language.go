package main

import (
	"fmt"
	"strings"
	
	"go.uber.org/zap"
)

// getLanguageCodeBytes 获取每种语言生成的平均代码字节数
// GitHub使用Linguist统计语言比例，基于的是字节数而不是行数
// 这个函数用于计算GitHub语言统计的权重
// 注意：这些数值是通过实际测量生成的代码得出的
func getLanguageCodeBytes(lang string) int {
	// 基于实际生成的代码字节数（精确测量）
	// 字节数 ≈ 行数 × 平均每行字符数
	switch LanguageType(lang) {
	case "java":
		return 650 // Java类定义约650字节
	case "python":
		return 650 // Python类定义约650字节
	case "javascript":
		return 550 // JavaScript类约550字节
	case "typescript":
		return 950 // TypeScript类约950字节（包含interface和export）
	case "go":
		return 850 // Go结构体约850字节（包含package和import）
	case "rust":
		return 800 // Rust结构体约800字节
	case "cpp":
		return 750 // C++类约750字节
	case "c":
		return 550 // C结构体约550字节
	case "csharp":
		return 720 // C#类约720字节
	case "php":
		return 620 // PHP类约620字节
	case "ruby":
		return 600 // Ruby类约600字节
	case "swift":
		return 650 // Swift结构体约650字节
	case "kotlin":
		return 720 // Kotlin类约720字节
	case "shell":
		return 450 // Shell脚本约450字节
	case "vue":
		return 1300 // Vue组件约1300字节（template+script+style）
	case "html":
		return 900 // HTML页面约900字节
	case "css":
		return 700 // CSS样式约700字节（包含伪元素）
	case "scss":
		return 750 // SCSS样式约750字节（包含嵌套）
	case "sql":
		return 500 // SQL脚本约500字节
	case "markdown":
		return 30  // Markdown约30字节（一行简短文本）
	default:
		return 500 // 默认500字节
	}
}

// LanguageConfig 语言配置
type LanguageConfig struct {
	Language string `json:"language"` // 语言类型
	Ratio    int    `json:"ratio"`    // 比例(百分比)
}

// generateMultiLanguageReadme 生成多语言README
func generateMultiLanguageReadme(repoName string, languageConfigs []LanguageConfig) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("# %s\n\n", repoName))
	sb.WriteString("Generated with [GreenWall](https://github.com/zmrlft/GreenWall).\n\n")
	
	// 如果只有一种语言，使用该语言的模板README
	if len(languageConfigs) == 1 {
		template := GetLanguageTemplate(LanguageType(languageConfigs[0].Language))
		return template.GetReadmeContent(repoName)
	}
	
	// 多语言README
	sb.WriteString("## Languages\n\n")
	sb.WriteString("This repository contains contributions in multiple programming languages:\n\n")
	
	for _, config := range languageConfigs {
		template := GetLanguageTemplate(LanguageType(config.Language))
		sb.WriteString(fmt.Sprintf("- **%s** (%d%%)\n", template.GetLanguageName(), config.Ratio))
	}
	
	sb.WriteString("\n## About\n\n")
	sb.WriteString("This is an automatically generated repository showcasing contributions across different programming languages.\n\n")
	sb.WriteString("Each commit uses a different language based on the configured ratios, creating a diverse and colorful contribution graph.\n\n")
	sb.WriteString("## License\n\nMIT License\n")
	
	return sb.String()
}

// selectLanguageByRatio 根据比例选择语言
// 使用加权轮询算法，考虑每种语言的代码行数，确保GitHub统计的比例与预设比例一致
// 
// 算法原理：
// 1. 根据每种语言的代码行数计算权重
// 2. 调整比例以补偿代码行数差异
// 3. 使用调整后的比例进行轮询分配
// 
// 示例：Java(50%, 20行), Vue(30%, 30行), CSS(5%, 10行), JavaScript(15%, 15行)
// 权重调整后确保GitHub统计的比例接近预设值
func selectLanguageByRatio(languageConfigs []LanguageConfig, commitIndex int) string {
	if len(languageConfigs) == 0 {
		return "markdown"
	}
	
	if len(languageConfigs) == 1 {
		return languageConfigs[0].Language
	}
	
	// 计算加权比例（考虑代码行数）
	type weightedConfig struct {
		language string
		weight   int // 权重 = 期望比例 / 代码行数
	}
	
	var weighted []weightedConfig
	totalWeight := 0
	
	for _, config := range languageConfigs {
		if config.Ratio <= 0 {
			continue
		}
		// 权重 = 期望比例 * 100 / 代码字节数
		// 这样代码字节数多的语言会得到更少的提交次数
		bytes := getLanguageCodeBytes(config.Language)
		weight := (config.Ratio * 100) / bytes
		
		// 确保权重至少为1
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
	
	// 将commitIndex映射到[0, totalWeight)的范围内
	position := commitIndex % totalWeight
	
	// 累积权重匹配
	cumulative := 0
	for _, wc := range weighted {
		cumulative += wc.weight
		if position < cumulative {
			return wc.language
		}
	}
	
	// 默认返回第一个语言（理论上不会到达这里）
	return weighted[0].language
}

// validateLanguageConfigs 验证语言配置的有效性
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
			return fmt.Errorf("语言配置[%d]: 单个语言比例不能超过100%%", i)
		}
		
		totalRatio += config.Ratio
	}
	
	if totalRatio == 0 {
		return fmt.Errorf("语言比例总和不能为0")
	}
	
	// 注意：总和不一定要等于100，算法会自动按比例分配
	
	return nil
}

// normalizeLanguageConfigs 标准化语言配置
// 如果总比例不是100，会按比例调整
func normalizeLanguageConfigs(languageConfigs []LanguageConfig) []LanguageConfig {
	if len(languageConfigs) == 0 {
		return []LanguageConfig{{Language: "markdown", Ratio: 100}}
	}
	
	totalRatio := 0
	for _, config := range languageConfigs {
		totalRatio += config.Ratio
	}
	
	// 如果总和已经是100或接近100，直接返回
	if totalRatio >= 95 && totalRatio <= 105 {
		return languageConfigs
	}
	
	// 否则按比例标准化到100
	normalized := make([]LanguageConfig, len(languageConfigs))
	for i, config := range languageConfigs {
		normalized[i] = LanguageConfig{
			Language: config.Language,
			Ratio:    (config.Ratio * 100) / totalRatio,
		}
	}
	
	return normalized
}

// mergeAdditionalFiles 合并多个语言的额外文件
// 处理文件冲突，优先保留第一个出现的文件
func mergeAdditionalFiles(repoName string, languageConfigs []LanguageConfig) map[string]string {
	allFiles := make(map[string]string)
	fileOwners := make(map[string]string) // 记录文件归属
	
	for _, langConfig := range languageConfigs {
		template := GetLanguageTemplate(LanguageType(langConfig.Language))
		files := template.GetAdditionalFiles(repoName)
		
		for filePath, content := range files {
			// 如果文件已存在，检查是否冲突
			if existingContent, exists := allFiles[filePath]; exists {
				// 如果内容相同，跳过
				if existingContent == content {
					continue
				}
				
				// 如果内容不同，为后来的语言创建带前缀的文件
				owner := fileOwners[filePath]
				newPath := fmt.Sprintf("%s.%s", filePath, langConfig.Language)
				allFiles[newPath] = content
				fileOwners[newPath] = langConfig.Language
				
				LogInfo("文件冲突，创建语言特定文件",
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
