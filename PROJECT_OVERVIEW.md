# Photinia 项目总览

<div align="center">

**跨平台智能推荐系统 - 完整解决方案**

打破平台孤岛，享受统一的个性化内容体验

</div>

---

## 📖 项目简介

Photinia 是一个完整的跨平台推荐系统，由三个核心组件组成：

1. **Photinia** - Chrome 浏览器扩展（数据采集 + 推荐注入）
2. **Kalkman** - NestJS 后端服务（分析引擎 + 推荐算法）
3. **Kalkweb** - React 前端应用（数据可视化 + 管理界面）

---

## 🎯 核心价值

### 问题
- 用户在多个视频平台（B站、YouTube、抖音）浏览，但每个平台的推荐算法是孤立的
- 在 A 平台的行为数据无法影响 B 平台的推荐
- 用户陷入单一平台的信息茧房

### 解决方案
- 统一采集用户在所有平台的行为数据
- 建立跨平台的用户画像
- 在任何平台注入基于完整数据的个性化推荐
- 用户完全掌控推荐策略和数据

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
                    │  ├─ rating_records
                    │  ├─ video_resources
                    │  └─ user_profiles_cache
                    └──────────────┘
                           ↓
                    ┌──────────────┐
                    │   Kalkman    │
                    │  后端分析引擎  │
                    │  ├─ 用户画像分析
                    │  ├─ 推荐算法
                    │  ├─ 智能缓存
                    │  └─ API 服务
                    └──────────────┘
                           ↓
                    ┌──────────────┐
                    │   Kalkweb    │
                    │  可视化前端    │
                    │  ├─ 数据分析
                    │  ├─ 视频库
                    │  └─ 用户对比
                    └──────────────┘
```

---

## 📦 组件详解

### 1. Photinia（浏览器扩展）

**技术栈：** Plasmo + React + TypeScript

**核心功能：**
- ✅ 浏览行为采集（评分系统）
- ✅ 视频资源采集（B站、YouTube、抖音）
- 🚧 跨平台推荐注入（开发中）
- ✅ 用户认证和数据同步

**关键文件：**
```
photinia/
├── background.ts              # 标签页监听
├── popup.tsx                  # 主界面
├── contents/
│   ├── video-collector.tsx    # 视频采集
│   └── recommendation-injector.tsx  # 推荐注入
└── components/
    ├── AuthForm.tsx           # 认证
    └── RecommendationSettings.tsx  # 设置
```

**README:** [photinia/README.md](README.md)

---

### 2. Kalkman（后端服务）

**技术栈：** NestJS + TypeScript + Supabase

**核心功能：**
- ✅ 用户画像分析（多维度）
- ✅ 智能推荐算法（6 因素加权）
- ✅ 视频资源管理
- ✅ 用户相似度计算
- ✅ 智能缓存系统

**关键文件：**
```
kalkman/src/
├── controllers/
│   ├── profile.controller.ts
│   ├── resource.controller.ts
│   └── recommendation.controller.ts
├── services/
│   ├── user-profile.service.ts
│   ├── resource.service.ts
│   ├── recommendation.service.ts
│   └── profile-cache.service.ts
└── types/
    ├── rating.types.ts
    └── resource.types.ts
```

**README:** [kalkman/README.md](kalkman/README.md)

---

### 3. Kalkweb（可视化前端）

**技术栈：** React + Vite + TypeScript + Recharts

**核心功能：**
- ✅ 用户画像可视化
- ✅ 视频资源库管理
- ✅ 用户对比分析
- ✅ 推荐预览
- ✅ 数据统计

**关键文件：**
```
kalkman-web/src/
├── pages/
│   ├── Dashboard.tsx
│   ├── UserProfile.tsx
│   ├── VideoLibrary.tsx
│   └── Compare.tsx
├── components/
│   └── Layout.tsx
└── api/
    └── index.ts
```

**README:** [kalkman/kalkman-web/README.md](kalkman/kalkman-web/README.md)

---

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- pnpm (推荐)
- Chrome 浏览器
- Supabase 账号

### 1. 克隆仓库

```bash
git clone https://github.com/yourusername/photinia.git
cd photinia
```

### 2. 配置 Supabase

1. 创建 Supabase 项目
2. 执行数据库脚本：
   ```bash
   # 在 Supabase SQL Editor 中执行
   kalkman/supabase-cache-table.sql
   kalkman/supabase-video-resources-table.sql
   ```

3. 获取 API 密钥：
   - Anon Key（用于 Photinia）
   - Service Role Key（用于 Kalkman）

### 3. 启动 Photinia（扩展）

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入 Supabase URL 和 Anon Key

# 开发模式
pnpm dev

# 在 Chrome 中加载扩展
# 1. 访问 chrome://extensions/
# 2. 开启"开发者模式"
# 3. 加载 build/chrome-mv3-dev 目录
```

### 4. 启动 Kalkman（后端）

```bash
cd kalkman

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入 Supabase URL 和 Service Role Key

# 启动服务
npm run start:dev

# 服务运行在 http://localhost:8733
```

### 5. 启动 Kalkweb（前端）

```bash
cd kalkman/kalkman-web

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 应用运行在 http://localhost:3000
```

---

## 📊 数据流

### 1. 数据采集流程

```
用户浏览网页
    ↓
关闭标签页
    ↓
Photinia 记录并评分
    ↓
本地存储（5 条触发上传）
    ↓
上传到 Supabase
    ↓
Kalkman 分析处理
    ↓
Kalkweb 可视化展示
```

### 2. 视频采集流程

```
用户访问视频列表页
    ↓
点击"采集视频"按钮
    ↓
Photinia 提取视频信息
    ↓
发送到 Kalkman API
    ↓
Kalkman 清洗和分类
    ↓
保存到 Supabase
    ↓
Kalkweb 展示和管理
```

### 3. 推荐注入流程（开发中）

```
用户访问视频平台
    ↓
Photinia 拦截推荐 API
    ↓
调用 Kalkman 获取推荐
    ↓
Kalkman 基于用户画像计算
    ↓
返回个性化推荐
    ↓
Photinia 混合并注入
    ↓
用户看到统一推荐
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

### user_profiles_cache（用户画像缓存）
```sql
CREATE TABLE user_profiles_cache (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  total_ratings INTEGER NOT NULL,
  average_score DECIMAL(3,2) NOT NULL,
  categories JSONB NOT NULL,
  domains JSONB NOT NULL,
  time_patterns JSONB NOT NULL,
  interests JSONB NOT NULL,
  sentiment JSONB NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

---

## 🛣️ 开发路线图

### ✅ 已完成（v1.0）
- [x] 浏览评分系统
- [x] 用户认证和数据隔离
- [x] 视频资源采集
- [x] 用户画像分析
- [x] 跨平台推荐算法
- [x] 数据可视化前端
- [x] 智能缓存系统

### 🚧 进行中（v1.1）
- [ ] B站推荐注入测试
- [ ] 推荐效果优化
- [ ] 用户反馈循环
- [ ] 性能优化

### 📅 计划中（v2.0）
- [ ] YouTube 推荐注入
- [ ] 抖音推荐注入
- [ ] 协同过滤推荐
- [ ] 推荐解释性
- [ ] 社交功能
- [ ] 移动端支持

### 🔮 未来愿景（v3.0+）
- [ ] 深度学习推荐模型
- [ ] 实时推荐（WebSocket）
- [ ] 更多平台（小红书、知乎）
- [ ] 内容类型扩展（文章、播客）
- [ ] AI 内容理解（LLM）
- [ ] 商业化探索

---

## 📈 性能指标

### Photinia
- 扩展大小：< 5MB
- 内存占用：< 50MB
- 评分响应：< 100ms

### Kalkman
- API 响应：< 100ms（缓存命中）
- 推荐计算：< 500ms（50 个候选）
- 并发支持：1000+ QPS
- 缓存命中率：> 80%

### Kalkweb
- 首屏加载：< 2s
- 页面切换：< 500ms
- 图表渲染：< 1s

---

## 🔒 安全和隐私

### 数据安全
- ✅ 所有数据加密传输（HTTPS）
- ✅ 用户数据完全隔离（RLS）
- ✅ 密码安全存储（Supabase Auth）
- ✅ 环境变量保护

### 隐私保护
- ✅ 用户完全掌控自己的数据
- ✅ 可随时删除所有数据
- ✅ 不收集敏感信息
- ✅ 符合 GDPR/CCPA 标准

### 透明度
- ✅ 开源代码
- ✅ 清晰的数据使用说明
- ✅ 推荐来源可见
- ✅ 用户可控的推荐策略

---

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 如何贡献

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 贡献方向

- 🐛 Bug 修复
- ✨ 新功能开发
- 📝 文档改进
- 🎨 UI/UX 优化
- 🧪 测试覆盖
- 🌍 国际化

详细指南：[CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 📞 联系方式

- **项目主页**: https://github.com/yourusername/photinia
- **问题反馈**: https://github.com/yourusername/photinia/issues
- **讨论区**: https://github.com/yourusername/photinia/discussions
- **邮箱**: your.email@example.com

---

## 🙏 致谢

### 技术栈
- [Plasmo](https://www.plasmo.com/) - 浏览器扩展框架
- [NestJS](https://nestjs.com/) - Node.js 框架
- [React](https://reactjs.org/) - UI 框架
- [Supabase](https://supabase.com/) - 后端服务
- [Vite](https://vitejs.dev/) - 构建工具
- [Recharts](https://recharts.org/) - 图表库

### 灵感来源
- 各大视频平台的推荐算法
- 用户对跨平台内容发现的需求
- 开源社区的贡献精神

---

## 📚 相关文档

- [Photinia README](README.md)
- [Kalkman README](kalkman/README.md)
- [Kalkweb README](kalkman/kalkman-web/README.md)
- [推荐算法详解](kalkman/RECOMMENDATION.md)
- [跨平台推荐方案](CROSS_PLATFORM_RECOMMENDATION.md)
- [实施计划](IMPLEMENTATION_PLAN.md)
- [视频采集指南](VIDEO_COLLECTION.md)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！**

**让我们一起打破平台孤岛，享受更好的内容体验！**

Made with ❤️ by [Your Name]

</div>
