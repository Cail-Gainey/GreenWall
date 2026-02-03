// open_directory.go 提供了跨平台的方法，用于在操作系统的默认文件资源管理器中打开指定目录。
package main

import (
	"fmt"
	"os/exec"
	"path/filepath"
	"runtime"
)

// openDirectory 尝试在默认文件浏览器中打开指定的路径。
// 它会根据当前的运行平台（Windows, macOS, Linux）选择合适的系统命令。
func openDirectory(path string) error {
	if path == "" {
		return fmt.Errorf("未提供路径")
	}

	// 转换为绝对路径以确保 explorer.exe 等工具能正确识别
	absPath, err := filepath.Abs(path)
	if err != nil {
		return fmt.Errorf("解析路径失败: %w", err)
	}

	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		// Windows 使用 explorer 命令
		cmd = exec.Command("explorer", absPath)
	case "darwin":
		// macOS 使用 open 命令
		cmd = exec.Command("open", absPath)
	default:
		// 通用 Linux 环境通常使用 xdg-open
		cmd = exec.Command("xdg-open", absPath)
	}

	// Windows 下保持资源管理器窗口可见，非 Windows 平台通常不需要显式控制窗口显示
	hideWindow := runtime.GOOS != "windows" 
	configureCommand(cmd, hideWindow)

	// 使用 Start() asynchronously 开启进程，不阻塞主程序
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("启动文件浏览器失败: %w", err)
	}

	return nil
}
