// logger.go 封装了基于 zap 的结构化日志系统，支持文件持久化和控制台实时输出。
package main

import (
	"os"
	"path/filepath"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// Logger 是全局共享的 zap 日志实例。
var Logger *zap.Logger

// InitLogger 配置并启动日志系统。
// 它会在程序运行目录下创建 `logs` 文件夹，并按日期生成日志文件。
// 同时，日志会以 JSON 格式保存到文件，以可读文本格式输出到控制台。
func InitLogger() error {
	// 获取程序所在目录
	execPath, err := os.Executable()
	if err != nil {
		return err
	}
	execDir := filepath.Dir(execPath)
	
	// 确保 logs 目录存在
	logsDir := filepath.Join(execDir, "logs")
	if err := os.MkdirAll(logsDir, 0755); err != nil {
		return err
	}
	
	// 按 YYYY-MM-DD 生成文件名
	logFileName := time.Now().Format("2006-01-02") + ".log"
	logFilePath := filepath.Join(logsDir, logFileName)
	
	// 打开或创建日志文件
	logFile, err := os.OpenFile(logFilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	
	// 定义日志的基础格式配置
	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "time",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		FunctionKey:    zapcore.OmitKey,
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.CapitalLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}
	
	// 文件输出核心：使用 JSON 格式，Info 级别
	fileCore := zapcore.NewCore(
		zapcore.NewJSONEncoder(encoderConfig),
		zapcore.AddSync(logFile),
		zapcore.InfoLevel,
	)
	
	// 控制台输出核心：使用 Console 友好格式，Debug 级别（更详尽）
	consoleCore := zapcore.NewCore(
		zapcore.NewConsoleEncoder(encoderConfig),
		zapcore.AddSync(os.Stdout),
		zapcore.DebugLevel,
	)
	
	// 合并输出目标
	core := zapcore.NewTee(fileCore, consoleCore)
	
	// 创建 Logger，并配置跳过调用栈层级以获得正确的调用信息
	Logger = zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1))
	
	Logger.Info("日志系统初始化成功",
		zap.String("log_dir", logsDir),
		zap.String("log_file", logFileName),
	)
	
	return nil
}

// CloseLogger 优雅关闭日志系统，确保所有缓冲日志已刷入磁盘。
func CloseLogger() {
	if Logger != nil {
		Logger.Sync()
	}
}

// LogInfo 输出信息级别的日志。
func LogInfo(msg string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Info(msg, fields...)
	}
}

// LogError 输出错误级别的日志。
func LogError(msg string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Error(msg, fields...)
	}
}

// LogWarn 输出警告级别的日志。
func LogWarn(msg string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Warn(msg, fields...)
	}
}

// LogDebug 输出调试级别的日志。
func LogDebug(msg string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Debug(msg, fields...)
	}
}

// LogFatal 输出致命错误级别的日志并导致程序退出。
func LogFatal(msg string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Fatal(msg, fields...)
	}
}
