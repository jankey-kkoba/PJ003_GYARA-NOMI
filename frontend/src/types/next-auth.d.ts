/**
 * Auth.js (NextAuth) の型定義拡張
 * JWTとセッションにカスタムフィールドを追加
 */
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  /**
   * セッションのユーザー情報を拡張
   */
  interface Session {
    user: {
      id: string
      email?: string | null
      role?: 'guest' | 'cast' | 'admin' | null
    }
  }

  /**
   * ユーザーオブジェクトを拡張（認証時に使用）
   */
  interface User {
    id: string
    email?: string | null
    role?: 'guest' | 'cast' | 'admin' | null
  }
}

declare module 'next-auth/jwt' {
  /**
   * JWTトークンを拡張
   */
  interface JWT {
    id: string
    role?: 'guest' | 'cast' | 'admin' | null
  }
}
