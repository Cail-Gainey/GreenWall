package languages

import (
	"fmt"
)

// MarkdownTemplate Markdown模板
type MarkdownTemplate struct{}

func (t *MarkdownTemplate) GetFileExtension() string     { return ".md" }
func (t *MarkdownTemplate) GetActivityFileName() string  { return "activity.md" }
func (t *MarkdownTemplate) GetLanguageName() string      { return "Markdown" }

func (t *MarkdownTemplate) GenerateCode(date string, commitNum int, totalCommits int) string {
	return fmt.Sprintf("%s commit %d\n", date, commitNum)
}

func (t *MarkdownTemplate) GetReadmeContent(repoName string) string {
	return fmt.Sprintf("# %s\n\nGenerated with [GreenWall](https://github.com/Cail-Gainey/GreenWall).\n", repoName)
}

func (t *MarkdownTemplate) GetAdditionalFiles(repoName string) map[string]string {
	return map[string]string{}
}
