# Photinia - 浏览评分数据收集扩展

Photinia 是一个 Chrome 浏览器扩展，用于收集用户的浏览体验评分数据。它是一个更大的数据分析生态系统的一部分。

## 系统架构

- **Photinia**（本项目）：浏览器扩展，负责数据收集
- **Kalkman**：后端数据分析服务
- **Kalkweb**：前端数据可视化仪表板

## 功能特性

- 📋 自动记录最近关闭的 10 个标签页
- 🎚️ 滑动条评分系统（1-10 分）
- 💾 自动保存所有评分记录
- 🔐 基于 Supabase Auth 的用户认证
- ☁️ 评分达到 5 条时自动上传到 Supabase
- 🔼 支持手动上传评分记录
- 👤 用户数据隔离
- 🧹 支持清空记录和最近关闭列表

## 使用方法

1. 安装扩展并注册/登录账号
2. 正常浏览网页，关闭标签页
3. 点击扩展图标查看最近关闭的标签页
4. 使用滑动条为标签页评分（1-10 分）
5. 评分会自动保存，达到 5 条时自动上传到云端
6. 数据可在 Kalkman 中分析，在 Kalkweb 中可视化

## 数据流

```
用户浏览器 → Photinia 扩展 → Supabase → Kalkman（分析）→ Kalkweb（可视化）
```

## 开发

### 环境配置

1. 复制 `.env.example` 为 `.env`
2. 填入你的 Supabase 配置：
   ```
   PLASMO_PUBLIC_SUPABASE_URL=your_supabase_url
   PLASMO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 加载扩展

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `build/chrome-mv3-dev` 目录

## 构建生产版本

```bash
pnpm build
```

这将在 `build/chrome-mv3-prod` 目录中创建生产版本。

## Supabase 数据库配置

### 表结构

```sql
-- 修改 rating_records 表，添加 user_id 字段
ALTER TABLE rating_records 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 创建索引
CREATE INDEX idx_rating_records_user_id ON rating_records(user_id);

-- 启用行级安全策略 (RLS)
ALTER TABLE rating_records ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能查看自己的记录
CREATE POLICY "Users can view own ratings" 
ON rating_records FOR SELECT 
USING (auth.uid() = user_id);

-- 创建策略：用户只能插入自己的记录
CREATE POLICY "Users can insert own ratings" 
ON rating_records FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 创建策略：用户只能删除自己的记录
CREATE POLICY "Users can delete own ratings" 
ON rating_records FOR DELETE 
USING (auth.uid() = user_id);
```

## 技术栈

- **Plasmo Framework** - 浏览器扩展开发框架
- **React** - UI 框架
- **TypeScript** - 类型安全
- **Supabase** - 认证和云端数据存储
- **Chrome Extension APIs** - 标签页监听和存储

## 项目结构

```
photinia/
├── background.ts          # 后台脚本（监听标签页事件）
├── popup.tsx             # 主界面组件
├── lib/
│   └── supabase.ts       # Supabase 客户端配置
├── components/
│   └── AuthForm.tsx      # 登录/注册表单
├── .env                  # 环境变量（不提交到 Git）
├── .env.example          # 环境变量模板
└── package.json          # 项目配置
```
