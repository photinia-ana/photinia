// 存储最近关闭的标签页（最多10条）
let recentClosedTabs: Array<{ url: string; title: string; closedAt: string }> = []
// 存储所有活动标签页的信息
const tabsInfo = new Map<number, { url: string; title: string }>()

// 监听标签页更新，记录标签页信息
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && !tab.url.startsWith("chrome-extension://") && !tab.url.startsWith("chrome://")) {
    tabsInfo.set(tabId, {
      url: tab.url,
      title: tab.title || "未知页面"
    })
  }
})

// 监听标签页激活，记录标签页信息
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId)
  if (tab.url && !tab.url.startsWith("chrome-extension://") && !tab.url.startsWith("chrome://")) {
    tabsInfo.set(activeInfo.tabId, {
      url: tab.url,
      title: tab.title || "未知页面"
    })
  }
})

// 监听标签页关闭事件
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  // 从缓存中获取标签页信息
  const tabInfo = tabsInfo.get(tabId)
  
  if (tabInfo) {
    // 添加到最近关闭列表（保持最多10条）
    recentClosedTabs.unshift({
      ...tabInfo,
      closedAt: new Date().toISOString()
    })
    
    // 只保留最近10条
    if (recentClosedTabs.length > 10) {
      recentClosedTabs = recentClosedTabs.slice(0, 10)
    }
    
    // 从缓存中删除
    tabsInfo.delete(tabId)
    
    // 通知 popup 有新的关闭标签页
    chrome.runtime.sendMessage({ 
      type: "TAB_CLOSED",
      recentTabs: recentClosedTabs
    }).catch(() => {
      // popup 可能未打开，忽略错误
    })
  }
})

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_RECENT_TABS") {
    sendResponse({ recentTabs: recentClosedTabs })
  } else if (message.type === "CLEAR_RECENT_TABS") {
    recentClosedTabs = []
    sendResponse({ success: true })
  }
  return true
})
