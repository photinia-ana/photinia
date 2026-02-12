import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"
import { Storage } from "@plasmohq/storage"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  css: ["../style.css"]
}

const storage = new Storage()

// 视频提取器配置
const extractors = {
  bilibili: {
    test: (url: string) => url.includes('bilibili.com'),
    selectors: {
      container: '.video-card, .bili-video-card, ytd-grid-video-renderer',
      title: '.title, .bili-video-card__info--tit, #video-title',
      link: 'a[href*="/video/"], a[href*="BV"]',
      author: '.up-name, .bili-video-card__info--author, #channel-name',
      duration: '.duration, .bili-video-card__stats--duration',
      cover: 'img[src*="i0.hdslb.com"], img[src*="i1.hdslb.com"]'
    }
  },
  youtube: {
    test: (url: string) => url.includes('youtube.com'),
    selectors: {
      container: 'ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer',
      title: '#video-title',
      link: '#video-title',
      author: '#channel-name a, .ytd-channel-name a',
      duration: '.ytd-thumbnail-overlay-time-status-renderer',
      cover: 'img[src*="i.ytimg.com"]'
    }
  },
  douyin: {
    test: (url: string) => url.includes('douyin.com'),
    selectors: {
      container: '.video-item, .aweme-item',
      title: '.video-title, .aweme-desc',
      link: 'a[href*="/video/"]',
      author: '.author-name',
      duration: '.duration',
      cover: 'img[src*="p3-pc.douyinpic.com"]'
    }
  }
}

function extractVideosFromPage() {
  const url = window.location.href
  let extractor = null
  
  // 找到匹配的提取器
  for (const [name, config] of Object.entries(extractors)) {
    if (config.test(url)) {
      extractor = config
      break
    }
  }
  
  if (!extractor) {
    return []
  }
  
  const videos = []
  const containers = document.querySelectorAll(extractor.selectors.container)
  
  containers.forEach((container) => {
    try {
      const titleEl = container.querySelector(extractor.selectors.title)
      const linkEl = container.querySelector(extractor.selectors.link)
      const authorEl = container.querySelector(extractor.selectors.author)
      const durationEl = container.querySelector(extractor.selectors.duration)
      const coverEl = container.querySelector(extractor.selectors.cover)
      
      const title = titleEl?.textContent?.trim() || titleEl?.getAttribute('title')?.trim()
      let videoUrl = linkEl?.getAttribute('href')
      
      // 处理相对路径
      if (videoUrl && !videoUrl.startsWith('http')) {
        videoUrl = new URL(videoUrl, window.location.origin).href
      }
      
      if (title && videoUrl) {
        videos.push({
          title,
          url: videoUrl,
          author: authorEl?.textContent?.trim() || '',
          duration: durationEl?.textContent?.trim() || '',
          cover: coverEl?.getAttribute('src') || '',
          sourceUrl: window.location.href,
          sourceDomain: window.location.hostname,
          extractedAt: new Date().toISOString()
        })
      }
    } catch (e) {
      console.error('提取视频信息失败:', e)
    }
  })
  
  // 去重（基于 URL）
  const uniqueVideos = Array.from(
    new Map(videos.map(v => [v.url, v])).values()
  )
  
  return uniqueVideos
}

export default function VideoCollector() {
  const [collecting, setCollecting] = useState(false)
  const [count, setCount] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // 检查当前页面是否是视频列表页
    const url = window.location.href
    const isVideoPage = Object.values(extractors).some(e => e.test(url))
    setVisible(isVideoPage)

    // 监听来自 popup 的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'EXTRACT_VIDEOS') {
        const videos = extractVideosFromPage()
        sendResponse({ videos })
      }
      return true
    })
  }, [])

  const handleCollect = async () => {
    setCollecting(true)
    
    try {
      const videos = extractVideosFromPage()
      setCount(videos.length)
      
      if (videos.length === 0) {
        alert('未找到视频，请确认当前页面是视频列表页')
        setCollecting(false)
        return
      }

      // 获取当前用户
      const user = await storage.get('supabase_user')
      
      if (!user) {
        alert('请先登录')
        setCollecting(false)
        return
      }

      // 发送到后端
      const response = await fetch('http://localhost:8733/resources/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          videos,
          sourceUrl: window.location.href,
          extractedAt: new Date().toISOString()
        })
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`✅ 成功采集 ${result.count} 个视频`)
      } else {
        alert(`❌ 采集失败: ${result.error}`)
      }
    } catch (error) {
      console.error('采集失败:', error)
      alert(`❌ 采集失败: ${error.message}`)
    } finally {
      setCollecting(false)
    }
  }

  if (!visible) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        zIndex: 999999,
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
      <button
        onClick={handleCollect}
        disabled={collecting}
        style={{
          backgroundColor: collecting ? '#ccc' : '#00a1d6',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: collecting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
        <span style={{ fontSize: '16px' }}>📹</span>
        {collecting ? '采集中...' : '采集视频'}
      </button>
      {count > 0 && (
        <span style={{ fontSize: '12px', color: '#666' }}>
          已采集 {count} 个
        </span>
      )}
    </div>
  )
}
