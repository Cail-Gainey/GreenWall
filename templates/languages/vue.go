package languages

import (
	"fmt"
)

// VueTemplate Vue模板
type VueTemplate struct{}

func (t *VueTemplate) GetFileExtension() string     { return ".vue" }
func (t *VueTemplate) GetActivityFileName() string  { return "Activity.vue" }
func (t *VueTemplate) GetLanguageName() string      { return "Vue" }

func (t *VueTemplate) GenerateCode(date string, commitNum int, totalCommits int) string {
	return fmt.Sprintf(`<template>
  <div class="contribution">
    <h3>Contribution Record</h3>
    <p>Date: {{ date }}</p>
    <p>Commit: {{ commitNumber }} / {{ totalCommits }}</p>
  </div>
</template>

<script>
export default {
  name: 'ContributionRecord',
  data() {
    return {
      date: '%s',
      commitNumber: %d,
      totalCommits: %d
    }
  }
}
</script>

<style scoped>
.contribution {
  border: 1px solid #ddd;
  padding: 1rem;
  margin: 1rem;
  border-radius: 4px;
}
</style>
`, date, commitNum, totalCommits)
}

func (t *VueTemplate) GetReadmeContent(repoName string) string {
	return fmt.Sprintf("# %s\n\nA Vue.js project generated with [GreenWall](https://github.com/Cail-Gainey/GreenWall).\n\n## About\n\nThis repository contains automatically generated Vue components representing contributions.\n\n## Structure\n\n- `src/components/` - Vue components\n- `package.json` - Dependencies\n- `README.md` - This file\n\n## License\n\nMIT License\n", repoName)
}

func (t *VueTemplate) GetAdditionalFiles(repoName string) map[string]string {
	return map[string]string{
		"package.json": fmt.Sprintf(`{
  "name": "%s",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build"
  },
  "dependencies": {
    "vue": "^3.0.0"
  },
  "devDependencies": {
    "@vue/cli-service": "~5.0.0"
  }
}
`, repoName),
		".gitignore": `node_modules/
dist/
.env
.DS_Store
.vscode/
.idea/
`,
	}
}
