package languages

import (
	"fmt"
	"strings"
)

// SwiftTemplate Swift模板
type SwiftTemplate struct{}

func (t *SwiftTemplate) GetFileExtension() string     { return ".swift" }
func (t *SwiftTemplate) GetActivityFileName() string  { return "Activity.swift" }
func (t *SwiftTemplate) GetLanguageName() string      { return "Swift" }

func (t *SwiftTemplate) GenerateCode(date string, commitNum int, totalCommits int) string {
	className := fmt.Sprintf("Contribution_%s_%d", strings.ReplaceAll(date, "-", "_"), commitNum)
	return fmt.Sprintf(`//
//  %s.swift
//  GreenWall
//
//  Created for contribution on %s
//  Commit %d of %d
//

import Foundation

struct %s {
    let date = "%s"
    let commitNumber = %d
    let totalCommits = %d
    
    var info: String {
        return "Contribution on \(date) (\(commitNumber)/\(totalCommits))"
    }
}

// Usage
#if DEBUG
let contribution = %s()
print(contribution.info)
#endif
`, className, date, commitNum, totalCommits, className, date, commitNum, totalCommits, className)
}

func (t *SwiftTemplate) GetReadmeContent(repoName string) string {
	return fmt.Sprintf("# %s\n\nA Swift project generated with [GreenWall](https://github.com/Cail-Gainey/GreenWall).\n\n## About\n\nThis repository contains automatically generated Swift contribution records.\n\n## Structure\n\n- `Sources/` - Swift source files\n- `Package.swift` - Swift package manifest\n- `README.md` - This file\n\n## License\n\nMIT License\n", repoName)
}

func (t *SwiftTemplate) GetAdditionalFiles(repoName string) map[string]string {
	return map[string]string{
		"Package.swift": fmt.Sprintf(`// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "%s",
    products: [
        .library(name: "%s", targets: ["%s"]),
    ],
    dependencies: [],
    targets: [
        .target(name: "%s", dependencies: []),
        .testTarget(name: "%sTests", dependencies: ["%s"]),
    ]
)
`, repoName, repoName, repoName, repoName, repoName, repoName),
		".gitignore": `.DS_Store
/.build
/Packages
/*.xcodeproj
/*.xcworkspace
`,
	}
}
