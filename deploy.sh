#!/bin/bash

echo "=== 小说平台部署脚本 ==="

echo "1. 构建Docker镜像..."
docker build -t novel-platform:latest .

echo "2. 创建必要目录..."
mkdir -p data uploads/covers uploads/novels ssl

echo "3. 启动服务..."
docker-compose up -d

echo "4. 查看服务状态..."
docker-compose ps

echo ""
echo "=== 部署完成 ==="
echo "访问地址: http://your-server-ip"
echo ""
echo "常用命令:"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
