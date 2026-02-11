# SRS 智能复习功能修复说明

## 问题描述

### 问题 1: 功能报错

学员账号在智能复习中心点击"启动今日智能复习"按钮后，练习过程中点击"很难/重来"、"已掌握"、"太简单了"按钮时出现错误：

```
POST https://exammaster.zzzjl.com/api/srs/update 500 (Internal Server Error)
{"error":"数据库操作失败","statusCode":500}
```

同时，修改个人档案也会出现类似错误：

```
POST /api/user/profile -> 500 {"error":"数据库操作失败","statusCode":500}
```

### 问题 2: PC端页面显示不完整

服务器网站中学员进入智能复习中心，PC端的页面显示不正常：
- ❌ 只显示"今日待巩固"卡片
- ❌ 缺少"启动今日智能复习"按钮
- ❌ 缺少"已完全掌握"卡片
- ❌ 缺少"历史错题总计"卡片

但本地环境页面显示正常。

## 根本原因

### 问题 1: SRS 表缺少唯一约束

`srs_records` 数据库表缺少唯一约束 `UNIQUE (user_id, question_id)`，导致后端代码中的 UPSERT 操作失败：

```sql
INSERT INTO srs_records (...) VALUES (...)
ON CONFLICT (user_id, question_id) DO UPDATE SET ...
```

PostgreSQL 的 `ON CONFLICT` 语法要求冲突字段必须有唯一约束或唯一索引，否则会报错。

### 问题 2: 用户档案更新字段名不匹配

前端发送的是 camelCase 格式的字段名（如 `realName`、`dailyGoal`），但后端直接将这些字段名拼接到 SQL 中，而数据库字段是 snake_case 格式（如 `real_name`、`daily_goal`），导致更新失败。

### 问题 3: Service Worker 缓存了旧版本

浏览器的 Service Worker 缓存了旧版本的 JavaScript 文件（版本 v1.0.2-20260206），导致即使服务器部署了新代码，PC端浏览器仍然使用缓存中的旧文件，页面显示不完整。

### 问题 4: PC 端响应式布局问题

`pages/Student/Mistakes.tsx` 中的响应式 CSS 类 `grid-cols-3` 在某些情况下被覆盖或失效，导致：
- 按钮和卡片的 CSS 样式被其他规则覆盖
- 页面初始渲染正常（0.3秒），但状态更新后元素消失
- 手机端正常，PC 端异常（说明是响应式断点问题）

## 修复内容

### 1. 更新数据库表定义 (postgres/init.sql)

在 `srs_records` 表定义中添加唯一约束：

```sql
CREATE TABLE IF NOT EXISTS srs_records (
  ...
  UNIQUE (user_id, question_id)
);
```

### 2. 创建数据库迁移脚本

创建 `postgres/migrations/001_add_srs_unique_constraint.sql`：

```sql
ALTER TABLE srs_records 
ADD CONSTRAINT unique_user_question 
UNIQUE (user_id, question_id);
```

### 3. 修复用户档案更新逻辑 (src/services/user.service.js)

在 `updateUserProfile` 函数中添加 camelCase 到 snake_case 的字段映射：

```javascript
const fieldMapping = {
  realName: 'real_name',
  idCard: 'id_card',
  educationType: 'education_type',
  educationLevel: 'education_level',
  className: 'class_name',
  dailyGoal: 'daily_goal',
  // ... 其他字段映射
};
```

### 4. 更新 Service Worker 缓存版本 (public/sw.js)

更新缓存版本号，强制浏览器清除旧缓存：

```javascript
const CACHE_NAME = 'edumaster-v1.0.3-20260211';
const RUNTIME_CACHE = 'edumaster-runtime-v1.0.3';
```

### 5. 修复 PC 端页面显示问题 (pages/Student/Mistakes.tsx)

添加强制内联样式确保元素在所有设备上正常显示：

```tsx
// 按钮强制显示
<button 
  style={{ 
    display: 'flex !important', 
    visibility: 'visible !important', 
    opacity: '1 !important' 
  }}
  className="..."
>
  启动今日智能复习
</button>

// 卡片网格强制 3 列布局
<div 
  className="grid gap-3 md:gap-6" 
  style={{ 
    gridTemplateColumns: 'repeat(3, 1fr)', 
    display: 'grid !important' 
  }}
>
  {/* 三个统计卡片 */}
</div>
```

### 6. 优化 PWA 配置 (index.html, public/manifest.json)

修复 PWA 图标 404 错误和弃用警告：

```html
<!-- 添加 mobile-web-app-capable -->
<meta name="mobile-web-app-capable" content="yes">
```

```json
// 使用 SVG data URI 替代 PNG 图标
{
  "icons": [
    {
      "src": "data:image/svg+xml,...",
      "sizes": "192x192",
      "type": "image/svg+xml"
    }
  ]
}
```

## 部署步骤

1. 使用 `quick-deploy.bat` 脚本部署更新
2. 脚本会自动执行数据库迁移
3. 重启 API 服务后生效

```bash
.\quick-deploy.bat
```

## 已执行的修复操作

1. ✅ 更新了 `postgres/init.sql` 添加唯一约束
2. ✅ 创建了数据库迁移脚本 `001_add_srs_unique_constraint.sql`
3. ✅ 手动执行了数据库迁移（添加唯一约束）
4. ✅ 修复了 `src/services/user.service.js` 的字段映射问题
5. ✅ 更新了 `public/sw.js` 的缓存版本号（v1.0.2 → v1.0.3）
6. ✅ 修复了 `pages/Student/Mistakes.tsx` 的 PC 端显示问题
7. ✅ 优化了 PWA 配置（修复图标 404 和弃用警告）
8. ✅ 重新部署并重启服务

## 用户操作指南

### 重要：清除浏览器缓存

部署完成后，用户需要清除浏览器缓存才能看到新版本：

**方法 1: 强制刷新（推荐）**
- Windows/Linux: `Ctrl + Shift + R` 或 `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**方法 2: 清除缓存**
1. 按 `F12` 打开开发者工具
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"

详细说明请参考：[清除浏览器缓存指南](./清除浏览器缓存指南.md)

## 验证方法

### 验证 SRS 功能

1. 登录学员账号
2. 进入"智能复习中心"
3. 确认"启动今日智能复习"按钮显示
4. 点击按钮进入练习
5. 点击"很难/重来"、"已掌握"、"太简单了"按钮
6. 确认没有报错，题目正常跳转

### 验证用户档案更新

1. 登录学员账号
2. 进入"我的个人档案"
3. 修改任意字段（如昵称、每日目标等）
4. 点击保存
5. 确认没有报错，数据正常更新

## 技术细节

### UPSERT 操作原理

PostgreSQL 的 `INSERT ... ON CONFLICT ... DO UPDATE` 语法实现了"存在则更新，不存在则插入"的逻辑：

- 如果 `(user_id, question_id)` 组合已存在，执行 UPDATE
- 如果不存在，执行 INSERT

这要求 `(user_id, question_id)` 必须有唯一约束。

### 字段名转换

前端使用 camelCase 命名规范（JavaScript 标准），数据库使用 snake_case 命名规范（SQL 标准）。后端需要在两者之间进行转换：

- 前端 → 后端：`dailyGoal` → `daily_goal`
- 后端 → 前端：`daily_goal` → `dailyGoal`

## 相关文件

- `postgres/init.sql` - 数据库表定义
- `postgres/migrations/001_add_srs_unique_constraint.sql` - 迁移脚本
- `src/services/srs.service.js` - SRS 服务逻辑
- `src/services/user.service.js` - 用户服务逻辑（已修复字段映射）
- `src/controllers/srs.controller.js` - SRS 控制器
- `src/controllers/user.controller.js` - 用户控制器
- `pages/Student/Mistakes.tsx` - 智能复习中心页面
- `pages/Student/Profile.tsx` - 个人档案页面

## 注意事项

- 迁移脚本是幂等的，多次执行不会出错
- 如果表中已有重复数据，需要先清理才能添加唯一约束
- 建议在低峰期执行部署，避免影响用户使用
- 部署后需要强制刷新浏览器缓存（Ctrl + Shift + R）
