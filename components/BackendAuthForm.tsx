import { useState } from "react"
import { registerWithBackend, loginWithBackend } from "~lib/api"
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

interface BackendAuthFormProps {
  onSuccess: () => void
}

export function BackendAuthForm({ onSuccess }: BackendAuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = isLogin
        ? await loginWithBackend(email, password)
        : await registerWithBackend(email, password, username)

      if (result.success && result.data) {
        // 保存 token 和用户信息
        await storage.set("auth_token", result.data.token)
        await storage.set("auth_user", result.data.user)
        await storage.set("auth_mode", "backend")
        
        onSuccess()
      } else {
        setError(result.error || "操作失败")
      }
    } catch (err) {
      setError(err.message || "网络错误")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      padding: "30px",
      minWidth: "400px",
      fontFamily: "Arial, sans-serif"
    }}>
      <h2 style={{ 
        textAlign: "center", 
        marginBottom: "10px",
        fontSize: "24px",
        color: "#333"
      }}>
        Photinia
      </h2>
      <p style={{
        textAlign: "center",
        color: "#666",
        fontSize: "12px",
        marginBottom: "30px"
      }}>
        后端认证模式
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{
            display: "block",
            marginBottom: "5px",
            fontSize: "13px",
            color: "#555"
          }}>
            邮箱
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
            placeholder="your@email.com"
          />
        </div>

        {!isLogin && (
          <div style={{ marginBottom: "15px" }}>
            <label style={{
              display: "block",
              marginBottom: "5px",
              fontSize: "13px",
              color: "#555"
            }}>
              用户名（可选）
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
              placeholder="昵称"
            />
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <label style={{
            display: "block",
            marginBottom: "5px",
            fontSize: "13px",
            color: "#555"
          }}>
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
            placeholder="至少 6 位"
          />
        </div>

        {error && (
          <div style={{
            padding: "10px",
            marginBottom: "15px",
            background: "#ffebee",
            color: "#c62828",
            borderRadius: "4px",
            fontSize: "13px"
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: loading ? "#ccc" : "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "15px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "处理中..." : (isLogin ? "登录" : "注册")}
        </button>
      </form>

      <div style={{
        marginTop: "20px",
        textAlign: "center"
      }}>
        <button
          onClick={() => {
            setIsLogin(!isLogin)
            setError(null)
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "#2196F3",
            fontSize: "13px",
            cursor: "pointer",
            textDecoration: "underline"
          }}
        >
          {isLogin ? "没有账号？立即注册" : "已有账号？立即登录"}
        </button>
      </div>
    </div>
  )
}
