#!/bin/bash

echo "打包项目（排除node_modules）..."

tar -czvf novel-platform.tar.gz \
  --exclude='node_modules' \
  --exclude='*/node_modules' \
  --exclude='client/dist' \
  --exclude='server/data' \
  --exclude='server/uploads' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='ssl' \
  .

echo "打包完成: novel-platform.tar.gz"
echo "文件大小: $(du -h novel-platform.tar.gz | cut -f1)"
