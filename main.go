// main 包是 GreenWall 应用程序的入口。
// GreenWall 是一个用于自定义 GitHub 贡献图的工具。
package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"go.uber.org/zap"
)

//go:embed all:frontend/dist
var assets embed.FS

// main 是应用程序的主进入点。
// 它负责初始化日志系统、创建应用实例，并启动 Wails 框架渲染前端界面。
func main() {
	// 初始化日志系统
	if err := InitLogger(); err != nil {
		println("Failed to initialize logger:", err.Error())
		return
	}
	defer CloseLogger()

	LogInfo("应用程序启动")

	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "GreenWall",
		Width:  1100,
		Height: 650,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		LogFatal("应用程序运行失败", zap.Error(err))
	}

	LogInfo("应用程序正常退出")
}
