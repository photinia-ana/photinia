/**
 * Kalkman API 客户端
 * 支持两种认证模式：
 * 1. Supabase Auth（方案 1）
 * 2. 后端 JWT Auth（方案 2）
 */

const API_BASE_URL = process.env.PLASMO_PUBLIC_API_URL || 'http://localhost:8733';

export interface RatingRecord {
  url: string;
  title: string;
  score: number;
  ratedAt: string;
}

export interface VideoResource {
  title: string;
  url: string;
  author?: string;
  duration?: string;
  cover?: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
  };
  error?: string;
  message?: string;
}

/**
 * ============================================
 * 方案 2: 后端认证 API
 * ============================================
 */

/**
 * 用户注册（后端认证）
 */
export async function registerWithBackend(email: string, password: string, username?: string): Promise<AuthResponse> {
  try {
    console.log('[API] 注册请求:', { url: `${API_BASE_URL}/auth/register`, email, username });
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username }),
    });

    console.log('[API] 注册响应状态:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('[API] 注册响应数据:', data);
    
    return data;
  } catch (error) {
    console.error('[API] 注册请求失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络请求失败',
    };
  }
}

/**
 * 用户登录（后端认证）
 */
export async function loginWithBackend(email: string, password: string): Promise<AuthResponse> {
  try {
    console.log('[API] 登录请求:', { url: `${API_BASE_URL}/auth/login`, email });
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('[API] 登录响应状态:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('[API] 登录响应数据:', data);
    
    return data;
  } catch (error) {
    console.error('[API] 登录请求失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络请求失败',
    };
  }
}

/**
 * 获取当前用户信息（后端认证）
 */
export async function getCurrentUserFromBackend(token: string): Promise<{ success: boolean; data?: User; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.json();
}

/**
 * 验证 token（后端认证）
 */
export async function verifyToken(token: string): Promise<{ success: boolean; data?: User; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  return response.json();
}

/**
 * ============================================
 * 数据提交 API（通用）
 * ============================================
 */

/**
 * 提交单条评分
 */
export async function submitRating(userId: string, rating: RatingRecord) {
  const response = await fetch(`${API_BASE_URL}/ratings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      url: rating.url,
      title: rating.title,
      score: rating.score,
      ratedAt: rating.ratedAt,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || '提交评分失败');
  }

  return data;
}

/**
 * 批量提交评分
 */
export async function submitBatchRatings(userId: string, ratings: RatingRecord[]) {
  const response = await fetch(`${API_BASE_URL}/ratings/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      ratings: ratings.map(r => ({
        url: r.url,
        title: r.title,
        score: r.score,
        ratedAt: r.ratedAt,
      })),
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || '批量提交评分失败');
  }

  return data;
}

/**
 * 获取用户评分记录
 */
export async function getUserRatings(userId: string, limit: number = 50, offset: number = 0) {
  const response = await fetch(
    `${API_BASE_URL}/ratings/${userId}?limit=${limit}&offset=${offset}`,
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || '获取评分记录失败');
  }

  return data.data;
}

/**
 * 获取用户评分统计
 */
export async function getUserRatingStats(userId: string) {
  const response = await fetch(`${API_BASE_URL}/ratings/${userId}/stats`);

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || '获取评分统计失败');
  }

  return data.data;
}

/**
 * 批量提交视频资源
 */
export async function submitBatchVideos(
  userId: string,
  videos: VideoResource[],
  sourceUrl: string,
) {
  const response = await fetch(`${API_BASE_URL}/resources/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      videos,
      sourceUrl,
      extractedAt: new Date().toISOString(),
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || '提交视频资源失败');
  }

  return data;
}

/**
 * 获取用户推荐视频
 */
export async function getUserRecommendations(userId: string, limit: number = 20) {
  const response = await fetch(
    `${API_BASE_URL}/recommendations/${userId}?limit=${limit}`,
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || '获取推荐失败');
  }

  return data.data;
}

/**
 * 获取用户画像
 */
export async function getUserProfile(userId: string) {
  const response = await fetch(`${API_BASE_URL}/profile/${userId}`);

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || '获取用户画像失败');
  }

  return data.data;
}
