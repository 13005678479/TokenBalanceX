#!/bin/bash

# TokenBalanceX Backend Build Script

echo "🚀 开始构建 TokenBalanceX Backend..."

# 清理之前的构建
echo "📦 清理旧的构建文件..."
rm -f token-balance-server

# 安装依赖
echo "📥 安装Go依赖..."
go mod download

# 构建应用
echo "🔨 构建应用程序..."
go build -o token-balance-server cmd/api/main.go

# 检查构建结果
if [ $? -eq 0 ]; then
    echo "✅ 构建成功！"
    echo "📁 可执行文件: ./token-balance-server"
    echo ""
    echo "🚀 启动命令:"
    echo "   ./token-balance-server"
    echo ""
    echo "📚 API文档地址:"
    echo "   http://localhost:8080/swagger/index.html"
else
    echo "❌ 构建失败！"
    exit 1
fi