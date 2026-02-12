import { useState } from "react"
import { signIn, signUp } from "~lib/supabase"

interface AuthFormProps {
  onSuccess: () => void
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setError("注册成功！请检查邮箱验证链接")
        return
      }
      onSuccess()
    } catch (err: any) {
      setError(err.message || "操作失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      padding: "20px",
      minWidth: "350px",
      fontFamily: "Arial, sans-serif"
    }}>
      <h2 style={{ marginBottom: "20px", textAlign: "center" }}>
        {isLogin ? "登录" : "注册"}
      </h2>

      {error && (
        <div style={{
          padding: "10px",
          marginBottom: "15px",
          background: error.includes("成功") ? "#e8f5e9" : "#ffebee",
          color: error.includes("成功") ? "#2e7d32" : "#c62828",
          borderRadius: "4px",
          fontSize: "13px",
          textAlign: "center"
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{
            display: "block",
            marginBottom: "5px",
            fontSize: "14px",
            color: "#666"
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
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{
            display: "block",
            marginBottom: "5px",
            fontSize: "14px",
            color: "#666"
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
          />
        </div>

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
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "处理中..." : (isLogin ? "登录" : "注册")}
        </button>
      </form>

      <div style={{
        marginTop: "15px",
        textAlign: "center",
        fontSize: "14px"
      }}>
        <button
          onClick={() => {
            setIsLogin(!isLogin)
            setError(null)
          }}
          style={{
            background: "none",
            border: "none",
            color: "#2196F3",
            cursor: "pointer",
            textDecoration: "underline"
          }}
        >
          {isLogin ? "没有账号？去注册" : "已有账号？去登录"}
        </button>
      </div>
    </div>
  )
}
