import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.PLASMO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("缺少 Supabase 配置信息，请检查 .env 文件")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface RatingRecord {
  id?: string
  user_id?: string
  url: string
  title: string
  score: number
  rated_at: string
  created_at?: string
}

export async function uploadRatings(records: RatingRecord[]) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("用户未登录")
  }

  // 为每条记录添加 user_id
  const recordsWithUserId = records.map(r => ({
    ...r,
    user_id: user.id
  }))

  const { data, error } = await supabase
    .from("rating_records")
    .insert(recordsWithUserId)
    .select()

  if (error) {
    throw new Error(`上传失败: ${error.message}`)
  }

  return data
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
