import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"

export const config: PlasmoCSConfig = {
  matches: [
    "*://*.bilibili.com/*",
    "*://*.youtube.com/*",
    "*://*.douyin.com/*"
  ],
  run_at: "document_start"
}

const storage = new Storage()

// 平台检测
function detectPlatform(): 'bilibili' | 'youtube' | 'douyin' | 'unknown' {
  const hostname = window.location.hostname
  if (hostname.includes('bilibili.com')) return 'bilibili'
  if (hostname.includes('youtube.com')) return 'youtube'
  if (hostname.includes('douyin.com')) return 'douyin'
  return 'unknown'
}

// 推荐 API 端点配置
const RECOMMENDATION_ENDPOINTS = {
  bilibili: [
    '/x/web-interface/index/top/feed/rcmd',
    '/x/web-interface/archive/related',
    '/x/web-interface/wbi/index/top/feed/rcmd'
  ],
  youtube: [
    '/youtubei/v1/browse',
    '/youtubei/v1/next'
  ],
  douyin: [
    '/aweme/v1/feed/'
  ]
}

// 检查是否是推荐 API
function isRecommendationAPI(url: string, platform: string): boolean {
  const endpoints = RECOMMENDATION_ENDPOINTS[platform] || []
  return endpoints.some(endpoint => url.includes(endpoint))
}

// 获取用户推荐设置
async function getSettings() {
  const settings = await storage.get('recommendation_settings')
  return settings || {
    enabled: true,
    platforms: {
      bilibili: true,
      youtube: true,
      douyin: true
    },
    mixRatio: 70, // 我们的推荐占 70%
    mixMode: 'interleave',
    showIndicator: true
  }
}

// 从 Kalkman 获取推荐
async function getOurRecommendations(userId: string, count: number = 20) {
  try {
    const response = await fetch(
      `http://localhost:8733/recommendations/user/${userId}?limit=${count}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('获取推荐失败:', error)
    return []
  }
}

// B站适配器
const BilibiliAdapter = {
  // 将我们的推荐转换为 B站格式
  formatRecommendation(video: any) {
    // 从 URL 提取 BV 号
    const bvMatch = video.url.match(/BV[a-zA-Z0-9]+/)
    const bvid = bvMatch ? bvMatch[0] : ''
    
    return {
      id: parseInt(video.id) || Math.floor(Math.random() * 1000000),
      bvid: bvid,
      cid: 0,
      goto: "av",
      uri: video.url,
      pic: video.cover || '',
      title: video.title,
      duration: this.parseDuration(video.duration),
      pubdate: new Date(video.extracted_at).getTime() / 1000,
      owner: {
        mid: 0,
        name: video.author || '未知UP主',
        face: ''
      },
      stat: {
        view: 0,
        danmaku: 0,
        reply: 0,
        favorite: 0,
        coin: 0,
        share: 0,
        like: 0
      },
      rcmd_reason: {
        content: `🎯 个性化推荐 (${Math.round(video.score * 100)}分)`
      },
      // 标记这是我们的推荐
      _photinia_recommendation: true,
      _photinia_score: video.score
    }
  },
  
  parseDuration(duration: string): number {
    if (!duration) return 0
    const parts = duration.split(':').map(p => parseInt(p))
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    }
    return 0
  }
}

// YouTube 适配器
const YouTubeAdapter = {
  formatRecommendation(video: any) {
    // 从 URL 提取视频 ID
    const videoIdMatch = video.url.match(/[?&]v=([^&]+)/)
    const videoId = videoIdMatch ? videoIdMatch[1] : ''
    
    return {
      videoId: videoId,
      thumbnail: {
        thumbnails: [
          { url: video.cover || '', width: 320, height: 180 }
        ]
      },
      title: {
        runs: [{ text: video.title }]
      },
      longBylineText: {
        runs: [{ text: video.author || 'Unknown' }]
      },
      publishedTimeText: {
        simpleText: this.formatDate(video.extracted_at)
      },
      lengthText: {
        simpleText: video.duration || ''
      },
      viewCountText: {
        simpleText: ''
      },
      badges: [
        {
          metadataBadgeRenderer: {
            label: `🎯 推荐 ${Math.round(video.score * 100)}%`,
            style: 'BADGE_STYLE_TYPE_SIMPLE'
          }
        }
      ],
      // 标记这是我们的推荐
      _photinia_recommendation: true,
      _photinia_score: video.score
    }
  },
  
  formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays}天前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`
    return `${Math.floor(diffDays / 365)}年前`
  }
}

// 混合推荐
function mixRecommendations(
  ourRecs: any[],
  platformRecs: any[],
  ratio: number,
  mode: string
): any[] {
  const ourCount = Math.floor(platformRecs.length * (ratio / 100))
  const platformCount = platformRecs.length - ourCount
  
  const selectedOurs = ourRecs.slice(0, ourCount)
  const selectedPlatform = platformRecs.slice(0, platformCount)
  
  if (mode === 'interleave') {
    // 交错混合
    const result = []
    const maxLen = Math.max(selectedOurs.length, selectedPlatform.length)
    
    for (let i = 0; i < maxLen; i++) {
      if (i < selectedOurs.length) result.push(selectedOurs[i])
      if (i < selectedPlatform.length) result.push(selectedPlatform[i])
    }
    
    return result
  } else if (mode === 'top') {
    // 我们的在前
    return [...selectedOurs, ...selectedPlatform]
  } else {
    // 随机混合
    const combined = [...selectedOurs, ...selectedPlatform]
    return combined.sort(() => Math.random() - 0.5)
  }
}

// 拦截 Fetch
const originalFetch = window.fetch
window.fetch = async function(...args) {
  const [url, options] = args
  const urlStr = typeof url === 'string' ? url : url.toString()
  
  const platform = detectPlatform()
  const settings = await getSettings()
  
  // 检查是否需要拦截
  if (
    settings.enabled &&
    settings.platforms[platform] &&
    isRecommendationAPI(urlStr, platform)
  ) {
    console.log('[Photinia] 拦截推荐 API:', urlStr)
    
    try {
      // 获取原始响应
      const response = await originalFetch.apply(this, args)
      const clonedResponse = response.clone()
      const originalData = await clonedResponse.json()
      
      // 获取用户 ID
      const user = await storage.get('supabase_user')
      if (!user) {
        console.log('[Photinia] 用户未登录，使用原始推荐')
        return response
      }
      
      // 获取我们的推荐
      const ourRecommendations = await getOurRecommendations(user.id, 50)
      
      if (ourRecommendations.length === 0) {
        console.log('[Photinia] 无推荐数据，使用原始推荐')
        return response
      }
      
      // 转换格式
      const adapter = platform === 'bilibili' ? BilibiliAdapter : YouTubeAdapter
      const formattedRecs = ourRecommendations.map(rec => 
        adapter.formatRecommendation(rec)
      )
      
      // 提取平台原始推荐
      let platformRecs = []
      if (platform === 'bilibili') {
        platformRecs = originalData.data?.item || []
      } else if (platform === 'youtube') {
        // YouTube 结构更复杂，需要深入提取
        platformRecs = [] // TODO: 实现 YouTube 提取逻辑
      }
      
      // 混合推荐
      const mixedRecs = mixRecommendations(
        formattedRecs,
        platformRecs,
        settings.mixRatio,
        settings.mixMode
      )
      
      // 构造新响应
      const newData = { ...originalData }
      if (platform === 'bilibili') {
        newData.data.item = mixedRecs
      }
      
      console.log('[Photinia] 推荐已混合:', {
        原始: platformRecs.length,
        我们的: formattedRecs.length,
        混合后: mixedRecs.length
      })
      
      // 返回修改后的响应
      return new Response(JSON.stringify(newData), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      })
      
    } catch (error) {
      console.error('[Photinia] 推荐注入失败:', error)
      // 失败时返回原始请求
      return originalFetch.apply(this, args)
    }
  }
  
  // 不需要拦截，正常请求
  return originalFetch.apply(this, args)
}

// 拦截 XMLHttpRequest
const originalXHROpen = XMLHttpRequest.prototype.open
const originalXHRSend = XMLHttpRequest.prototype.send

XMLHttpRequest.prototype.open = function(method, url, ...rest) {
  this._url = url.toString()
  return originalXHROpen.apply(this, [method, url, ...rest])
}

XMLHttpRequest.prototype.send = async function(...args) {
  const platform = detectPlatform()
  const settings = await getSettings()
  
  if (
    settings.enabled &&
    settings.platforms[platform] &&
    this._url &&
    isRecommendationAPI(this._url, platform)
  ) {
    console.log('[Photinia] 拦截 XHR 推荐 API:', this._url)
    
    // 保存原始 onload
    const originalOnLoad = this.onload
    
    this.onload = async function() {
      try {
        const originalData = JSON.parse(this.responseText)
        
        // 获取用户和推荐（逻辑同 fetch）
        const user = await storage.get('supabase_user')
        if (!user) {
          return originalOnLoad?.apply(this, arguments)
        }
        
        const ourRecommendations = await getOurRecommendations(user.id, 50)
        if (ourRecommendations.length === 0) {
          return originalOnLoad?.apply(this, arguments)
        }
        
        // 转换和混合（逻辑同 fetch）
        const adapter = platform === 'bilibili' ? BilibiliAdapter : YouTubeAdapter
        const formattedRecs = ourRecommendations.map(rec => 
          adapter.formatRecommendation(rec)
        )
        
        let platformRecs = []
        if (platform === 'bilibili') {
          platformRecs = originalData.data?.item || []
        }
        
        const mixedRecs = mixRecommendations(
          formattedRecs,
          platformRecs,
          settings.mixRatio,
          settings.mixMode
        )
        
        const newData = { ...originalData }
        if (platform === 'bilibili') {
          newData.data.item = mixedRecs
        }
        
        // 修改响应
        Object.defineProperty(this, 'responseText', {
          writable: true,
          value: JSON.stringify(newData)
        })
        Object.defineProperty(this, 'response', {
          writable: true,
          value: JSON.stringify(newData)
        })
        
        console.log('[Photinia] XHR 推荐已混合')
        
      } catch (error) {
        console.error('[Photinia] XHR 推荐注入失败:', error)
      }
      
      return originalOnLoad?.apply(this, arguments)
    }
  }
  
  return originalXHRSend.apply(this, args)
}

console.log('[Photinia] 推荐注入器已加载 -', detectPlatform())

export {}
