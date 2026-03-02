# Photinia - 跨平台智能推荐系统

<div align="center">

**打破平台孤岛，享受统一的个性化内容体验**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/chrome-extension-green.svg)](https://chrome.google.com/webstore)
[![TypeScript](https://img.shields.io/badge/typescript-5.3.3-blue.svg)](https://www.typescriptlang.org/)

[English](README_EN.md) | 简体中文

</div>

---

## 🌟 愿景

在多个视频平台（B站、YouTube、抖音）浏览时，每个平台的推荐算法都是孤立的。你在 B站看技术视频，在 YouTube 看英文教程，但这些行为数据无法互通，导致：

- ❌ 在 A 平台找不到 B 平台的优质内容
- ❌ 每个平台都要重新"训练"推荐算法
- ❌ 陷入单一平台的信息茧房

**Photinia 的使命：** 建立跨平台的统一用户画像，在任何平台都能获得基于完整行为数据的个性化推荐。

---

## 🎯 核心功能

### 1. 📊 浏览行为采集
- 自动记录最近关闭的 10 个标签页
- 滑动条评分系统（1-10 分）
- 智能分类和标签提取
- 用户行为数据安全存储

### 2. 📹 视频资源库
- 一键采集视频列表（B站、YouTube、抖音）
- 自动提取视频信息（标题、作者、时长、封面）
- 智能去重和分类
- 跨平台视频管理

### 3. 🎯 跨平台推荐注入（开发中）
- 在任何平台注入统一的个性化推荐
- 混合策略：70% 个性化 + 30% 平台原生
- 用户完全掌控推荐比例和策略
- 推荐来源透明可见

### 4. 🔐 隐私和安全
- 基于 Supabase Auth 的用户认证
- 用户数据完全隔离
- 本地优先，云端同步
- 符合 GDPR/CCPA 标准

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                              │
├─────────────────────────────────────────────────────────────┤
│  Photinia 扩展                                                │
│  ├─ 行为采集：评分、浏览历史                                   │
│  ├─ 视频采集：批量提取视频列表                                 │
│  └─ 推荐注入：替换平台推荐（开发中）                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    ┌──────────────┐
                    │   Supabase   │
                    │  数据存储+认证 │
                    └──────────────┘
                           ↓
                    ┌──────────────┐
                    │   Kalkman    │
                    │  后端分析引擎  │
                    │  ├─ 用户画像   │
                    │  ├─ 推荐算法   │
                    │  └─ 智能缓存   │
                    └──────────────┘
                           ↓
                    ┌──────────────┐
                    │   Kalkweb    │
                    │  可视化前端    │
                    │  ├─ 数据分析   │
                    │  ├─ 视频库     │
                    │  └─ 用户对比   │
                    └──────────────┘
```

---

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 环境配置

1. 复制 `.env.example` 为 `.env`
2. 填入你的 Supabase 配置：

```env
PLASMO_PUBLIC_SUPABASE_URL=your_supabase_url
PLASMO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
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

### 构建生产版本

```bash
pnpm build
```

生产版本将在 `build/chrome-mv3-prod` 目录中生成。

---

## 📖 使用指南

### 基础功能

1. **注册/登录**
   - 点击扩展图标
   - 使用邮箱注册账号
   - 登录后开始使用

2. **评分浏览记录**
   - 正常浏览网页
   - 关闭标签页后，在扩展中查看
   - 使用滑动条评分（1-10 分）
   - 评分自动保存并上传

3. **采集视频列表**
   - 访问视频列表页（B站首页、YouTube 搜索等）
   - 点击页面右下角的"📹 采集视频"按钮
   - 或在扩展 popup 中点击"采集当前页视频"
   - 视频信息自动提取并保存

### 高级功能（开发中）

4. **跨平台推荐**
   - 在扩展设置中启用"跨平台推荐"
   - 选择要启用的平台（B站、YouTube、抖音）
   - 调整推荐占比（0-100%）
   - 在视频平台上看到统一的个性化推荐

---

## 🎨 功能截图

### 评分界面
![评分界面](docs/screenshots/rating.png)

### 视频采集
![视频采集](docs/screenshots/collection.png)

### 推荐设置
![推荐设置](docs/screenshots/settings.png)

---

## 🔧 技术栈

- **框架**: Plasmo Framework v0.90.5
- **语言**: TypeScript 5.3.3
- **UI**: React 18.2.0
- **存储**: Supabase (PostgreSQL + Auth)
- **包管理**: pnpm

### Chrome Extension APIs
- `chrome.tabs` - 标签页监听
- `chrome.runtime` - 消息传递
- `chrome.storage` - 本地存储
- `chrome.webRequest` - 网络请求拦截（推荐注入）

---

## 📂 项目结构

```
photinia/
├── background.ts              # 后台脚本（标签页监听）
├── popup.tsx                  # 主界面（评分+设置）
├── contents/
│   ├── video-collector.tsx    # 视频采集（页面注入）
│   └── recommendation-injector.tsx  # 推荐注入（开发中）
├── components/
│   ├── AuthForm.tsx           # 登录/注册表单
│   └── RecommendationSettings.tsx  # 推荐设置面板
├── lib/
│   └── supabase.ts            # Supabase 客户端
└── assets/
    └── icon.png               # 扩展图标
```

---

## 🗄️ 数据库结构

### rating_records（评分记录）
```sql
CREATE TABLE rating_records (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  score INTEGER CHECK (score >= 1 AND score <= 10),
  rated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### video_resources（视频资源）
```sql
CREATE TABLE video_resources (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  url_hash TEXT GENERATED ALWAYS AS (md5(url)) STORED,
  author TEXT,
  duration TEXT,
  cover TEXT,
  source_url TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  extracted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, url_hash)
);
```

详细的数据库配置请参考 [DATABASE.md](docs/DATABASE.md)

---

## 🛣️ 开发路线图

### ✅ 已完成
- [x] 浏览评分系统
- [x] 用户认证和数据隔离
- [x] 视频资源采集（B站、YouTube、抖音）
- [x] 用户画像分析
- [x] 跨平台推荐算法
- [x] 推荐注入框架

### 🚧 进行中
- [ ] B站推荐注入测试
- [ ] 推荐效果优化
- [ ] 用户反馈循环

### 📅 计划中
- [ ] YouTube 推荐注入
- [ ] 抖音推荐注入
- [ ] 推荐解释性（为什么推荐）
- [ ] 社交功能（关注、分享）
- [ ] 移动端支持
- [ ] 更多平台（小红书、知乎）

---

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

详细的贡献指南请参考 [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- [Plasmo Framework](https://www.plasmo.com/) - 优秀的浏览器扩展开发框架
- [Supabase](https://supabase.com/) - 开源的 Firebase 替代方案
- [Segment](https://github.com/leizongmin/node-segment) - 中文分词库

---

## 📞 联系方式

- 项目主页: [https://github.com/photinia-ana/photinia](https://github.com/photinia-ana/photinia)
- 问题反馈: [Issues](https://github.com/photinia-ana/photinia/issues)
- 邮箱: roooyhe@163.com

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！**

Made with ❤️ by [RoyHe roooyhe@163.com]

</div>

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
