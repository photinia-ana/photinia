import { useEffect, useState } from "react"
import { Storage } from "@plasmohq/storage"
import { uploadRatings, type RatingRecord as SupabaseRatingRecord, getCurrentUser, signOut } from "~lib/supabase"
import { AuthForm } from "~components/AuthForm"

const storage = new Storage()

interface RatingRecord {
  score: number
  timestamp: string
  url?: string
  title?: string
}

interface RecentTab {
  url: string
  title: string
  closedAt: string
}

function IndexPopup() {
  const [ratings, setRatings] = useState<RatingRecord[]>([])
  const [recentTabs, setRecentTabs] = useState<RecentTab[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({})
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadRatings()
      loadRecentTabs()
      
      // 监听标签页关闭事件
      const messageListener = (message: any) => {
        if (message.type === "TAB_CLOSED") {
          setRecentTabs(message.recentTabs)
        }
      }
      
      chrome.runtime.onMessage.addListener(messageListener)
      
      return () => {
        chrome.runtime.onMessage.removeListener(messageListener)
      }
    }
  }, [user])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error("检查用户状态失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
      setRatings([])
      setRecentTabs([])
    } catch (error) {
      console.error("登出失败:", error)
    }
  }

  const loadRecentTabs = async () => {
    const response = await chrome.runtime.sendMessage({ type: "GET_RECENT_TABS" })
    if (response?.recentTabs) {
      setRecentTabs(response.recentTabs)
      // 初始化滑动条值为 5
      const initialValues: Record<string, number> = {}
      response.recentTabs.forEach((tab: RecentTab) => {
        initialValues[tab.closedAt] = 5
      })
      setSliderValues(initialValues)
    }
  }

  const loadRatings = async () => {
    const records = await storage.get("ratings") || []
    setRatings(records)
  }

  const handleQuickRating = async (tab: RecentTab, score: number) => {
    const record: RatingRecord = {
      score,
      timestamp: new Date().toISOString(),
      url: tab.url,
      title: tab.title
    }
    
    const existingRecords = await storage.get("ratings") || []
    existingRecords.push(record)
    await storage.set("ratings", existingRecords)
    
    // 从最近列表中移除已评分的标签页
    const updatedTabs = recentTabs.filter(t => t.closedAt !== tab.closedAt)
    setRecentTabs(updatedTabs)
    
    // 重新加载评分记录
    loadRatings()
    
    // 检查是否达到 5 条，自动上传
    if (existingRecords.length >= 5) {
      await autoUploadRatings(existingRecords)
    }
  }

  const autoUploadRatings = async (records: RatingRecord[]) => {
    try {
      const supabaseRecords: SupabaseRatingRecord[] = records.map(r => ({
        url: r.url || "",
        title: r.title || "未知页面",
        score: r.score,
        rated_at: r.timestamp
      }))

      await uploadRatings(supabaseRecords)
      
      // 上传成功后清空本地记录
      await storage.set("ratings", [])
      setRatings([])
      setUploadMessage("✓ 已自动上传 5 条记录")
      setTimeout(() => setUploadMessage(null), 3000)
    } catch (error) {
      console.error("自动上传失败:", error)
      setUploadMessage(`✗ 自动上传失败: ${error.message}`)
      setTimeout(() => setUploadMessage(null), 3000)
    }
  }

  const handleManualUpload = async () => {
    if (ratings.length === 0) {
      setUploadMessage("没有可上传的记录")
      setTimeout(() => setUploadMessage(null), 2000)
      return
    }

    setUploading(true)
    try {
      const supabaseRecords: SupabaseRatingRecord[] = ratings.map(r => ({
        url: r.url || "",
        title: r.title || "未知页面",
        score: r.score,
        rated_at: r.timestamp
      }))

      await uploadRatings(supabaseRecords)
      
      // 上传成功后清空本地记录
      await storage.set("ratings", [])
      setRatings([])
      setUploadMessage(`✓ 成功上传 ${ratings.length} 条记录`)
      setTimeout(() => setUploadMessage(null), 3000)
    } catch (error) {
      console.error("上传失败:", error)
      setUploadMessage(`✗ 上传失败: ${error.message}`)
      setTimeout(() => setUploadMessage(null), 3000)
    } finally {
      setUploading(false)
    }
  }

  const clearRatings = async () => {
    await storage.set("ratings", [])
    setRatings([])
  }

  const clearRecentTabs = async () => {
    await chrome.runtime.sendMessage({ type: "CLEAR_RECENT_TABS" })
    setRecentTabs([])
  }

  const collectVideosFromCurrentPage = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_VIDEOS' }, async (response) => {
        if (chrome.runtime.lastError) {
          alert('❌ 无法采集：请刷新页面后重试')
          return
        }
        
        if (response?.videos?.length > 0) {
          setUploadMessage(`正在上传 ${response.videos.length} 个视频...`)
          
          try {
            const result = await fetch('http://localhost:8733/resources/batch', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.id,
                videos: response.videos,
                sourceUrl: tab.url,
                extractedAt: new Date().toISOString()
              })
            })
            
            const data = await result.json()
            
            if (data.success) {
              setUploadMessage(`✓ 成功采集 ${data.count} 个视频`)
            } else {
              setUploadMessage(`✗ 采集失败: ${data.error}`)
            }
          } catch (error) {
            setUploadMessage(`✗ 上传失败: ${error.message}`)
          }
          
          setTimeout(() => setUploadMessage(null), 3000)
        } else {
          alert('❌ 未找到视频，请确认当前页面是视频列表页')
        }
      })
    } catch (error) {
      console.error('采集失败:', error)
      alert(`❌ 采集失败: ${error.message}`)
    }
  }

  const averageScore = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
    : "0"

  // 加载中状态
  if (loading) {
    return (
      <div style={{
        padding: "40px",
        textAlign: "center",
        fontFamily: "Arial, sans-serif"
      }}>
        <div style={{ fontSize: "16px", color: "#666" }}>加载中...</div>
      </div>
    )
  }

  // 未登录状态
  if (!user) {
    return <AuthForm onSuccess={checkUser} />
  }

  // 已登录状态
  return (
    <div style={{
      padding: "20px",
      minWidth: "400px",
      maxWidth: "500px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h2 style={{ margin: 0, fontSize: "20px" }}>Photinia</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {ratings.length > 0 && (
            <span style={{
              background: ratings.length >= 5 ? "#4CAF50" : "#ff9800",
              color: "white",
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "bold"
            }}>
              {ratings.length} 条待上传
            </span>
          )}
          <button
            onClick={handleSignOut}
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              background: "transparent",
              color: "#999",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            登出
          </button>
        </div>
      </div>

      <div style={{
        padding: "8px",
        marginBottom: "15px",
        background: "#f5f5f5",
        borderRadius: "4px",
        fontSize: "12px",
        color: "#666",
        textAlign: "center"
      }}>
        {user.email}
      </div>

      {/* 采集视频按钮 */}
      <button
        onClick={collectVideosFromCurrentPage}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "15px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px"
        }}
      >
        <span style={{ fontSize: "16px" }}>📹</span>
        采集当前页视频
      </button>

      {uploadMessage && (
        <div style={{
          padding: "10px",
          marginBottom: "15px",
          background: uploadMessage.startsWith("✓") ? "#e8f5e9" : "#ffebee",
          color: uploadMessage.startsWith("✓") ? "#2e7d32" : "#c62828",
          borderRadius: "4px",
          fontSize: "13px",
          textAlign: "center"
        }}>
          {uploadMessage}
        </div>
      )}

      {/* 最近关闭的标签页 - 快速评分 */}
      {recentTabs.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "10px" 
          }}>
            <h3 style={{ margin: 0, fontSize: "14px", color: "#666" }}>
              最近关闭 ({recentTabs.length}/10)
            </h3>
            <button
              onClick={clearRecentTabs}
              style={{
                padding: "4px 8px",
                fontSize: "11px",
                background: "transparent",
                color: "#999",
                border: "1px solid #ddd",
                borderRadius: "3px",
                cursor: "pointer"
              }}
            >
              清空
            </button>
          </div>
          <div style={{
            maxHeight: "300px",
            overflowY: "auto",
            border: "1px solid #e0e0e0",
            borderRadius: "6px"
          }}>
            {recentTabs.map((tab, index) => (
              <div
                key={tab.closedAt}
                style={{
                  padding: "12px",
                  borderBottom: index < recentTabs.length - 1 ? "1px solid #f0f0f0" : "none",
                  background: index % 2 === 0 ? "#fafafa" : "white"
                }}
              >
                <div style={{
                  fontSize: "13px",
                  fontWeight: "500",
                  marginBottom: "4px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "#333"
                }}>
                  {tab.title}
                </div>
                <div style={{
                  fontSize: "11px",
                  color: "#999",
                  marginBottom: "8px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                  {tab.url}
                </div>
                <div style={{ marginBottom: "4px" }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px"
                  }}>
                    <span style={{ fontSize: "18px" }}>😞</span>
                    <span style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#2196F3"
                    }}>
                      {sliderValues[tab.closedAt] || 5} 分
                    </span>
                    <span style={{ fontSize: "18px" }}>😊</span>
                  </div>
                  <div style={{ position: "relative", padding: "0 10px" }}>
                    {/* 刻度线 */}
                    <div style={{
                      position: "absolute",
                      top: "8px",
                      left: "10px",
                      right: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      pointerEvents: "none"
                    }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <div
                          key={num}
                          style={{
                            width: "2px",
                            height: "12px",
                            background: "#ddd",
                            borderRadius: "1px"
                          }}
                        />
                      ))}
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={sliderValues[tab.closedAt] || 5}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value)
                        setSliderValues({
                          ...sliderValues,
                          [tab.closedAt]: newValue
                        })
                      }}
                      onMouseUp={() => handleQuickRating(tab, sliderValues[tab.closedAt] || 5)}
                      onTouchEnd={() => handleQuickRating(tab, sliderValues[tab.closedAt] || 5)}
                      style={{
                        width: "100%",
                        height: "8px",
                        borderRadius: "4px",
                        outline: "none",
                        appearance: "none",
                        WebkitAppearance: "none",
                        background: "#f0f0f0",
                        cursor: "pointer"
                      }}
                    />
                    <style>{`
                      input[type="range"]::-webkit-slider-thumb {
                        appearance: none;
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        background: #2196F3;
                        cursor: pointer;
                        box-shadow: 0 2px 6px rgba(33, 150, 243, 0.4);
                        transition: transform 0.1s;
                      }
                      input[type="range"]::-webkit-slider-thumb:hover {
                        transform: scale(1.1);
                      }
                      input[type="range"]::-webkit-slider-thumb:active {
                        transform: scale(1.2);
                      }
                      input[type="range"]::-moz-range-thumb {
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        background: #2196F3;
                        border: none;
                        cursor: pointer;
                        box-shadow: 0 2px 6px rgba(33, 150, 243, 0.4);
                        transition: transform 0.1s;
                      }
                      input[type="range"]::-moz-range-thumb:hover {
                        transform: scale(1.1);
                      }
                      input[type="range"]::-moz-range-thumb:active {
                        transform: scale(1.2);
                      }
                    `}</style>
                  </div>
                  {/* 刻度数字 */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 10px 0",
                    fontSize: "10px",
                    color: "#999"
                  }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <span key={num} style={{ width: "10px", textAlign: "center" }}>
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* 已评分记录 */}
      {ratings.length > 0 && (
        <div style={{ marginBottom: "15px" }}>
          <h3 style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
            已评分记录
          </h3>
          <div style={{
            maxHeight: "200px",
            overflowY: "auto",
            border: "1px solid #e0e0e0",
            borderRadius: "6px"
          }}>
            {ratings.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
                暂无评分记录
              </div>
            ) : (
              ratings.slice().reverse().map((record, index) => (
                <div
                  key={index}
                  style={{
                    padding: "10px",
                    borderBottom: index < ratings.length - 1 ? "1px solid #f0f0f0" : "none",
                    background: index % 2 === 0 ? "#fafafa" : "white"
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "5px"
                  }}>
                    <span style={{ 
                      fontSize: "16px", 
                      fontWeight: "bold", 
                      color: record.score >= 7 ? "#4CAF50" : record.score >= 4 ? "#ff9800" : "#f44336"
                    }}>
                      {record.score} 分
                    </span>
                    <span style={{ fontSize: "11px", color: "#999" }}>
                      {new Date(record.timestamp).toLocaleString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  {record.title && (
                    <div style={{
                      fontSize: "12px",
                      color: "#666",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {record.title}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {ratings.length > 0 && (
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleManualUpload}
            disabled={uploading}
            style={{
              flex: 1,
              padding: "10px",
              background: uploading ? "#ccc" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: uploading ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "bold"
            }}
          >
            {uploading ? "上传中..." : "立即上传"}
          </button>
          <button
            onClick={clearRatings}
            disabled={uploading}
            style={{
              flex: 1,
              padding: "10px",
              background: uploading ? "#ccc" : "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: uploading ? "not-allowed" : "pointer",
              fontSize: "14px"
            }}
          >
            清空记录
          </button>
        </div>
      )}
    </div>
  )
}

export default IndexPopup
