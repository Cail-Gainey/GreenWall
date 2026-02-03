//go:build windows

// cmd_windows.go 包含 Windows 平台特有的命令执行配置。
package main

import (
	"os/exec"
	"syscall"
)

// configureCommand 应用 Windows 特有的进程属性。
// 如果 hideWindow 为 true，则会隐藏执行命令时弹出的 CMD 窗口，
// 这在后台执行 Git 命令而不干扰用户时非常有用。
func configureCommand(cmd *exec.Cmd, hideWindow bool) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: hideWindow}
}
