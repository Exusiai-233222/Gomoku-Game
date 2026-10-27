# ⚫ 网页版五子棋对战系统 (Gomoku Game System)

本项目是一个完整的 Web 全栈应用，包含用户认证、网页版双人五子棋对战、超时判负机制、胜负战绩记录与全站排行榜。项目完美满足了“表单页面设计及网页游戏实现”的实验要求。

## ✨ 核心功能

1. **用户系统**：支持用户注册、登录、退出，以及修改密码（密码采用 bcrypt 加密存储）。
2. **五子棋对战**：基于 HTML5 Canvas 开发的 15×15 标准棋盘，支持黑白交替落子。
3. **悔棋功能**：支持随时撤销上一步落子，并将回合交还给上一位玩家。
4. **超时判负**：每个回合限时 30 秒，倒计时结束未落子则自动判负。
5. **自动判断输赢**：系统精确判断横、竖、斜任意方向的“五子连珠”，同时支持棋盘下满时的“平局”判定。
6. **战绩记录与排行榜**：自动记录玩家的胜、负、平场次。排行榜优先按胜场降序排列，胜场相同时按败场升序排列。

## 🛠 技术栈

- **前端**：原生 HTML5, CSS3, 原生 JavaScript (ES Module, Canvas 渲染)
- **后端**：Node.js, Express 5
- **数据库**：MySQL 8 (使用 `mysql2` 连接池, bcrypt 密码哈希)
- **会话管理**：express-session

## 🚀 快速启动

### 1. 环境准备

确保你的电脑已安装 Node.js (v18+) 和 MySQL (v8+)，并启动 MySQL 服务。

### 2. 配置数据库

在 MySQL 中创建一个名为 `login_demo` 的数据库，并执行以下 SQL 建表语句：

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gomoku_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  result TINYINT NOT NULL COMMENT '1=胜, 2=负, 3=平局',
  duration_ms INT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
