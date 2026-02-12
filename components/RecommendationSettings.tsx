import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

interface Settings {
  enabled: boolean
  platforms: {
    bilibili: boolean
    youtube: boolean
    douyin: boolean
  }
  mixRatio: number
  mixMode: 'interleave' | 'top' | 'random'
  showIndicator: boolean
}

export function RecommendationSettings() {
  const [settings, setSettings] = useState<Settings>({
    enabled: true,
    platforms: {
      bilibili: true,
      youtube: true,
      douyin: true
    },
    mixRatio: 70,
    mixMode: 'interleave',
    showIndicator: true
  })

  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const stored = await storage.get('recommendation_settings')
    if (stored) {
      setSettings(stored)
    }
  }

  const saveSettings = async () => {
    await storage.set('recommendation_settings', settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{
      padding: '20px',
      background: '#f9f9f9',
      borderRadius: '8px',
      marginTop: '20px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
        🎯 跨平台推荐设置
      </h3>

      {/* 总开关 */}
      <div style={{
        marginBottom: '15px',
        padding: '12px',
        background: '#fff',
        borderRadius: '6px'
      }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({
              ...settings,
              enabled: e.target.checked
            })}
            style={{ marginRight: '8px' }}
          />
          <span style={{ fontWeight: '500' }}>启用跨平台推荐</span>
        </label>
        <div style={{
          fontSize: '12px',
          color: '#666',
          marginTop: '5px',
          marginLeft: '24px'
        }}>
          在视频平台上使用统一的个性化推荐
        </div>
      </div>

      {settings.enabled && (
        <>
          {/* 平台选择 */}
          <div style={{
            marginBottom: '15px',
            padding: '12px',
            background: '#fff',
            borderRadius: '6px'
          }}>
            <div style={{
              fontWeight: '500',
              marginBottom: '10px',
              fontSize: '14px'
            }}>
              启用平台
            </div>
            
            <label style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={settings.platforms.bilibili}
                onChange={(e) => setSettings({
                  ...settings,
                  platforms: {
                    ...settings.platforms,
                    bilibili: e.target.checked
                  }
                })}
                style={{ marginRight: '8px' }}
              />
              <span>哔哩哔哩 (B站)</span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={settings.platforms.youtube}
                onChange={(e) => setSettings({
                  ...settings,
                  platforms: {
                    ...settings.platforms,
                    youtube: e.target.checked
                  }
                })}
                style={{ marginRight: '8px' }}
              />
              <span>YouTube</span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={settings.platforms.douyin}
                onChange={(e) => setSettings({
                  ...settings,
                  platforms: {
                    ...settings.platforms,
                    douyin: e.target.checked
                  }
                })}
                style={{ marginRight: '8px' }}
              />
              <span>抖音</span>
            </label>
          </div>

          {/* 推荐占比 */}
          <div style={{
            marginBottom: '15px',
            padding: '12px',
            background: '#fff',
            borderRadius: '6px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <span style={{ fontWeight: '500', fontSize: '14px' }}>
                个性化推荐占比
              </span>
              <span style={{
                background: '#2196F3',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {settings.mixRatio}%
              </span>
            </div>
            
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={settings.mixRatio}
              onChange={(e) => setSettings({
                ...settings,
                mixRatio: parseInt(e.target.value)
              })}
              style={{
                width: '100%',
                cursor: 'pointer'
              }}
            />
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#999',
              marginTop: '5px'
            }}>
              <span>平台原生</span>
              <span>个性化</span>
            </div>
          </div>

          {/* 混合模式 */}
          <div style={{
            marginBottom: '15px',
            padding: '12px',
            background: '#fff',
            borderRadius: '6px'
          }}>
            <div style={{
              fontWeight: '500',
              marginBottom: '10px',
              fontSize: '14px'
            }}>
              混合模式
            </div>
            
            <select
              value={settings.mixMode}
              onChange={(e) => setSettings({
                ...settings,
                mixMode: e.target.value as any
              })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <option value="interleave">交错混合（推荐）</option>
              <option value="top">个性化优先</option>
              <option value="random">随机混合</option>
            </select>
            
            <div style={{
              fontSize: '11px',
              color: '#666',
              marginTop: '5px'
            }}>
              {settings.mixMode === 'interleave' && '个性化推荐和平台推荐交错显示'}
              {settings.mixMode === 'top' && '个性化推荐显示在前面'}
              {settings.mixMode === 'random' && '随机混合两种推荐'}
            </div>
          </div>

          {/* 显示标识 */}
          <div style={{
            marginBottom: '15px',
            padding: '12px',
            background: '#fff',
            borderRadius: '6px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={settings.showIndicator}
                onChange={(e) => setSettings({
                  ...settings,
                  showIndicator: e.target.checked
                })}
                style={{ marginRight: '8px' }}
              />
              <span style={{ fontSize: '14px' }}>显示推荐来源标识</span>
            </label>
            <div style={{
              fontSize: '11px',
              color: '#666',
              marginTop: '5px',
              marginLeft: '24px'
            }}>
              在视频上显示 🎯 标识表示这是个性化推荐
            </div>
          </div>
        </>
      )}

      {/* 保存按钮 */}
      <button
        onClick={saveSettings}
        style={{
          width: '100%',
          padding: '10px',
          background: saved ? '#4CAF50' : '#2196F3',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'background 0.3s'
        }}
      >
        {saved ? '✓ 已保存' : '保存设置'}
      </button>

      {/* 说明 */}
      <div style={{
        marginTop: '15px',
        padding: '10px',
        background: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#856404'
      }}>
        <strong>💡 提示：</strong> 启用后，在支持的视频平台上会看到基于你完整浏览历史的个性化推荐，打破单一平台的算法限制。
      </div>
    </div>
  )
}
