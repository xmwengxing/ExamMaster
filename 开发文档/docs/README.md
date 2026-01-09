# 项目文档索引

本目录包含EduMaster项目的技术文档和功能说明。

## 📚 文档分类

### 核心技术文档

#### [DEEPSEEK_API 迁移文档.md](DEEPSEEK_API_MIGRATION.md)
**AI功能集成文档**
- DeepSeek API配置
- API Key管理
- 使用指南

#### [调试指南.md](DEBUGGING_GUIDE.md)
**调试指南**
- 常见问题诊断
- 调试工具使用
- 日志分析

### 功能优化文档

#### [题库批量导入测试指南.md](QUESTION_IMPORT_OPTIMIZATION.md)
**题库批量导入优化**
- CSV格式说明
- 支持2-8个选项
- 特殊字符处理
- 数据验证机制
- 错误提示优化

#### [实操练习历史记录功能与移动端优化.md](PRACTICAL_HISTORY_FEATURE.md)
**实操历史记录功能**
- 历史记录查看
- 移动端优化
- 提交记录管理

#### [做题模式交互优化.md](PRACTICE_MODE_OPTIMIZATION.md)
**练习模式优化**
- 移动端滑动切换
- 按钮位置调整
- 交互体验改进

## 🔍 快速查找

### 我想了解...

**"如何批量导入题目？"**
→ [题库批量导入测试指南.md](QUESTION_IMPORT_OPTIMIZATION.md)

**"管理员有哪些权限？"**
→ [ADMIN_ROLES.md](ADMIN_ROLES.md)

**"如何配置AI功能？"**
→ [DEEPSEEK_API 迁移文档.md](DEEPSEEK_API_MIGRATION.md)

**"遇到问题如何调试？"**
→ [调试指南.md](DEBUGGING_GUIDE.md)

**"实操练习有什么新功能？"**
→ [实操练习历史记录功能与移动端优化.md](PRACTICAL_HISTORY_FEATURE.md)

**"练习模式有什么优化？"**
→ [做题模式交互优化.md](PRACTICE_MODE_OPTIMIZATION.md)

## 📖 相关文档

### 根目录文档
- [../README.md](../README.md) - 项目主文档
- [../调试指南.md](../DEPLOYMENT_GUIDE.md) - 部署维护手册
- [../CHANGELOG.md](../CHANGELOG.md) - 版本更新日志
- [../题库批量导入测试指南.md](../IMPORT_TEST_GUIDE.md) - 题目导入测试指南

### 脚本工具
- `../scripts/add-test-questions.js` - 批量添加测试题目
- `../scripts/deploy.sh` - 部署脚本
- `../scripts/setup-ssl.sh` - SSL配置脚本

## 🛠️ 开发工具

### 调试脚本
项目包含以下调试脚本（位于 `scripts/` 目录）：
- `check-bank-perms.cjs` - 检查学员题库授权数据
- `check-admin.cjs` - 检查超级管理员信息
- `check-all-admins.cjs` - 检查所有管理员信息
- `reset-admin.cjs` - 重置管理员密码

### 使用方法
```bash
cd scripts
node check-admin.cjs
```

## 📝 文档维护

### 文档更新原则
1. **及时更新** - 功能变更后及时更新文档
2. **清晰简洁** - 使用简洁的语言和清晰的结构
3. **示例丰富** - 提供足够的代码示例和截图
4. **版本标注** - 标注文档对应的版本号和更新日期

### 文档命名规范
- 技术文档：大写字母+下划线（如：ADMIN_ROLES.md）
- 功能文档：描述性命名（如：QUESTION_IMPORT_OPTIMIZATION.md）
- 临时文档：添加日期后缀（如：FIX_SUMMARY_2026-01-07.md）

## 🔄 文档历史

### 2026-01-07
- ✅ 清理临时修复文档（18个）
- ✅ 清理临时测试文档（9个）
- ✅ 整合重复部署文档（5个）
- ✅ 创建CHANGELOG.md记录版本历史
- ✅ 更新README.md为完整项目说明
- ✅ 重组文档结构，保留核心文档

### 文档精简
- **删除前**: 49个文档
- **删除后**: 13个文档
- **精简率**: 73%

## 📞 需要帮助？

如果在使用过程中遇到问题：

1. 查看对应的文档了解详细信息
2. 检查 [调试指南.md](DEBUGGING_GUIDE.md) 获取调试方法
3. 查看 [../CHANGELOG.md](../CHANGELOG.md) 了解最新更新
4. 提交Issue反馈问题

---

**最后更新**: 2026-01-07  
**维护者**: EduMaster 开发团队
