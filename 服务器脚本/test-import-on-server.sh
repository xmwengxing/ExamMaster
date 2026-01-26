#!/bin/bash
# 在服务器上测试导入 API

echo "=== 测试题目导入 API ==="
echo ""

# 获取管理员 token（需要先登录）
echo "1. 登录获取 token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"admin","password":"admin","role":"ADMIN"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败"
  echo "响应: $LOGIN_RESPONSE"
  exit 1
fi

echo "✓ 登录成功，token: ${TOKEN:0:20}..."
echo ""

# 测试导入一道题目
echo "2. 测试导入单道题目..."
IMPORT_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/banks/bank-1768268205466/import" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "questions": [
      {
        "type": "SINGLE",
        "content": "测试题目",
        "options": ["选项A", "选项B", "选项C", "选项D"],
        "answer": "A",
        "explanation": "这是测试题目"
      }
    ]
  }')

echo "响应: $IMPORT_RESPONSE"
echo ""

# 检查响应
if echo "$IMPORT_RESPONSE" | grep -q "success"; then
  echo "✓ 导入成功"
else
  echo "❌ 导入失败"
  echo ""
  echo "=== 检查应用日志 ==="
  pm2 logs edumaster-api --lines 20 --nostream
fi
