# VPS服务崩溃问题解决报告

## 问题描述
部署新功能到VPS后，管理员账号无法登录，提示"账号或密码错误"。

## 诊断过程

### 1. 初步诊断
- 运行 `vps-diagnose-and-fix.sh` 发现：
  - ✅ 管理员账号存在且密码正确
  - ❌ 后端服务端口3001未监听
  - ⚠️ PM2进程显示online但重启了17次

### 2. 深入分析
- PM2进程状态显示online，但端口未监听
- 重启次数17次说明服务一直在崩溃重启
- 问题不是账号密码，而是后端服务未正常运行

### 3. 查看错误日志
```bash
pm2 logs edumaster-api --lines 100 --err
```

发现关键错误：
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/www/edumaster/utils/questionValidation.js' 
imported from /var/www/edumaster/server.js
```

## 根本原因
**缺少 `utils/questionValidation.js` 文件**

server.js 第一行导入了这个文件：
```javascript
import { validateFillInBlankAnswers } from './utils/questionValidation.js';
```

但部署时这个文件没有上传到VPS，导致服务启动失败并不断重启。

## 解决方案

### 1. 创建utils目录
```bash
ssh root@23.95.213.28 "mkdir -p /var/www/edumaster/utils"
```

### 2. 上传缺失文件
```bash
scp utils/questionValidation.js root@23.95.213.28:/var/www/edumaster/utils/questionValidation.js
```

### 3. 重启PM2服务
```bash
ssh root@23.95.213.28 "cd /var/www/edumaster && pm2 restart edumaster-api"
```

### 4. 验证修复
```bash
# 检查端口监听
netstat -tlnp | grep 3001
# 输出: tcp6 :::3001 LISTEN ✓

# 测试登录API
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"admin","password":"admin","role":"ADMIN"}'
# 返回: {"token":"...","user":{...}} ✓
```

## 修复结果
✅ **问题已完全解决**

- PM2进程状态：**online**（稳定运行）
- 端口监听：**tcp6 :::3001 LISTEN**
- 登录功能：**正常工作**
- 管理员账号：**可以正常登录**

## 经验教训

### 1. 部署检查清单
在部署新功能时，需要确保：
- [ ] 所有新增的文件都已上传
- [ ] 所有新增的目录都已创建
- [ ] 依赖包已正确安装
- [ ] 环境变量已正确配置

### 2. 改进部署脚本
建议更新 `deploy-quick.sh` 脚本，确保包含所有必要文件：

```bash
# 添加utils目录到部署脚本
rsync -avz --exclude 'node_modules' \
  --exclude '.git' \
  --include 'utils/**' \
  ./ root@23.95.213.28:/var/www/edumaster/
```

### 3. 监控和告警
- 设置PM2进程监控
- 配置重启次数告警
- 定期检查错误日志

## 相关文件
- `utils/questionValidation.js` - 填空题验证工具
- `vps-diagnose-and-fix.sh` - VPS诊断脚本
- `vps-check-service.sh` - 服务状态检查脚本
- `upload-missing-file.sh` - 文件上传脚本

## 时间线
- 2026-01-08 12:42 - 用户报告登录失败
- 2026-01-08 13:01 - 发现服务崩溃（缺少文件）
- 2026-01-08 18:47 - 上传文件并重启服务
- 2026-01-08 18:48 - 验证修复成功

## 联系方式
如有问题，请查看：
- `VPS修复指南.md`
- `管理员账号修复指南.md`
- `SSH命令集合.txt`
