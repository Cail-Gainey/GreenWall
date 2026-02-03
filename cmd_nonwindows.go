//go:build !windows

// cmd_nonwindows.go 包含非 Windows 平台下的命令执行配置。
package main

import "os/exec"

// configureCommand 在非 Windows 平台下不需要特殊配置，此函数为空实现。
func configureCommand(cmd *exec.Cmd, hideWindow bool) {}
