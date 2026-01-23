# PostgreSQL 安装指南

## Windows 环境安装 PostgreSQL 14+

### 方法 1：使用官方安装程序（推荐）

1. **下载 PostgreSQL**
   - 访问官方网站：https://www.postgresql.org/download/windows/
   - 或直接访问 EnterpriseDB 下载页面：https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - 选择 PostgreSQL 14 或更高版本（推荐 14.x 或 15.x）

2. **运行安装程序**
   - 双击下载的 `.exe` 文件
   - 选择安装目录（默认：`C:\Program Files\PostgreSQL\14`）
   - 选择要安装的组件：
     - ✅ PostgreSQL Server
     - ✅ pgAdmin 4（图形化管理工具）
     - ✅ Command Line Tools
     - ✅ Stack Builder（可选）

3. **配置数据库**
   - 设置数据目录（默认：`C:\Program Files\PostgreSQL\14\data`）
   - **设置超级用户密码**（请记住此密码，后续需要使用）
   - 设置端口号（默认：5432）
   - 设置区域设置（推荐：Chinese, China 或 Default locale）

4. **完成安装**
   - 等待安装完成
   - 可以选择启动 Stack Builder 安装额外工具（可跳过）

### 方法 2：使用 Chocolatey（命令行方式）

如果已安装 Chocolatey 包管理器：

```powershell
# 以管理员身份运行 PowerShell
choco install postgresql14 -y
```

### 验证安装

1. **检查 PostgreSQL 服务是否运行**
   ```powershell
   # 打开服务管理器
   services.msc
   
   # 或使用命令行
   Get-Service postgresql*
   ```
   
   确保服务状态为 "Running"

2. **测试连接**
   ```powershell
   # 使用 psql 命令行工具连接
   psql -U postgres
   
   # 输入安装时设置的密码
   # 成功连接后会显示 postgres=# 提示符
   
   # 查看版本
   SELECT version();
   
   # 退出
   \q
   ```

3. **使用 pgAdmin 4 图形界面**
   - 打开 pgAdmin 4（开始菜单中搜索）
   - 首次打开需要设置主密码
   - 连接到本地 PostgreSQL 服务器
   - 输入安装时设置的密码

### 创建项目数据库和用户

```sql
-- 连接到 PostgreSQL（使用 psql 或 pgAdmin）

-- 创建数据库
CREATE DATABASE edumaster
  WITH ENCODING 'UTF8'
  LC_COLLATE = 'Chinese_China.936'
  LC_CTYPE = 'Chinese_China.936'
  TEMPLATE template0;

-- 创建用户
CREATE USER edumaster_user WITH PASSWORD 'your_secure_password_here';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE edumaster TO edumaster_user;

-- 连接到 edumaster 数据库
\c edumaster

-- 授予 schema 权限
GRANT ALL ON SCHEMA public TO edumaster_user;
```

### 配置环境变量（可选）

将 PostgreSQL 的 bin 目录添加到系统 PATH：

1. 右键"此电脑" → "属性" → "高级系统设置"
2. 点击"环境变量"
3. 在"系统变量"中找到 `Path`，点击"编辑"
4. 添加新路径：`C:\Program Files\PostgreSQL\14\bin`
5. 点击"确定"保存

### 配置 .env 文件

在项目根目录创建 `.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edumaster
DB_USER=edumaster_user
DB_PASSWORD=your_secure_password_here

# JWT 配置
JWT_SECRET=your_jwt_secret_key_here

# 服务器配置
PORT=3001
NODE_ENV=development
```

### 常见问题

#### 1. 端口 5432 已被占用（已解决）
**当前配置：PostgreSQL 18 已配置为使用端口 5433**

如果需要修改端口：
```powershell
# 1. 停止 PostgreSQL 服务
Stop-Service postgresql-x64-18

# 2. 修改配置文件
# 文件位置：D:\Program Files\PostgreSQL\18\data\postgresql.conf
# 找到 port = 5433，修改为其他端口

# 3. 启动服务
Start-Service postgresql-x64-18

# 4. 验证端口
netstat -ano | findstr :5433
```

**注意：** 如果修改了端口，请同步更新 .env 文件中的 DB_PORT 配置

#### 2. 无法连接到数据库
- 检查 PostgreSQL 服务是否运行
- 检查防火墙设置
- 检查 `pg_hba.conf` 配置文件
- 确认用户名和密码正确

#### 3. 编码问题
如果遇到中文乱码，确保：
- 数据库编码为 UTF8
- 客户端编码为 UTF8
- 在连接字符串中指定：`client_encoding=utf8`

### 下一步

完成 PostgreSQL 安装后，继续执行任务 2：创建 PostgreSQL 数据库架构。
