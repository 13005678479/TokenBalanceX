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

# Go项目通用忽略规则

# 依赖包目录
vendor/

# 编译产物
*.exe
*.exe~
*.dll
*.so
*.dylib
*.test

# 输出目录
bin/
build/

# 日志文件
logs/
*.log

# 环境变量文件
# .env
# .env.local
# .env.*.local

# IDE和编辑器文件
.idea/
.vscode/
*.swp
*.swo
*~
.DS_Store

# 测试覆盖率文件
coverage.out
coverage.html

# Go工具生成的文件
go.work
go.work.sum

# 临时文件
tmp/
temp/

# Docker相关
.docker/
*.dockerfile

# 数据库文件
*.db
*.sql
*.sqlite

# 操作系统文件
Thumbs.db
.DS_Store

# 其他不需要提交的文件
*.pem
*.key
*.p12