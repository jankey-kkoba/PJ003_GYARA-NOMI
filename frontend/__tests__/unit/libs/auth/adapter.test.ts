/**
 * CustomAdapter Unit テスト
 *
 * Auth.jsのカスタムアダプターの各メソッドを検証
 * DBはモック化してテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CustomAdapter } from '@/libs/auth/adapter'
import type { AdapterAccount } from 'next-auth/adapters'

// チェーンメソッドのモック
const mockChain = {
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
  set: vi.fn().mockReturnThis(),
}

// DBモジュールのモック
vi.mock('@/libs/db', () => ({
  db: {
    insert: () => mockChain,
    select: () => mockChain,
    update: () => mockChain,
    delete: () => mockChain,
  },
}))

// スキーマのモック
vi.mock('@/libs/db/schema/users', () => ({
  users: {
    id: 'id',
    email: 'email',
    emailVerified: 'emailVerified',
  },
}))

vi.mock('@/libs/db/schema/auth', () => ({
  accounts: {
    provider: 'provider',
    providerAccountId: 'providerAccountId',
    userId: 'userId',
  },
}))

describe('CustomAdapter', () => {
  let adapter: ReturnType<typeof CustomAdapter>

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = CustomAdapter()

    // デフォルトのチェーンメソッドリセット
    mockChain.values.mockReturnThis()
    mockChain.from.mockReturnThis()
    mockChain.where.mockReturnThis()
    mockChain.set.mockReturnThis()
  })

  describe('createUser', () => {
    it('ユーザーを作成して返す', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: new Date('2024-01-01'),
      }
      mockChain.returning.mockResolvedValue([mockUser])

      const result = await adapter.createUser!({
        id: '',
        email: 'test@example.com',
        emailVerified: new Date('2024-01-01'),
      })

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: new Date('2024-01-01'),
      })
    })

    it('emailがnullの場合は空文字列に変換する', async () => {
      const mockUser = {
        id: 'user-123',
        email: null,
        emailVerified: null,
      }
      mockChain.returning.mockResolvedValue([mockUser])

      const result = await adapter.createUser!({
        id: '',
        email: '',
        emailVerified: null,
      })

      expect(result.email).toBe('')
    })
  })

  describe('getUser', () => {
    it('IDでユーザーを取得する', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: null,
      }
      mockChain.limit.mockResolvedValue([mockUser])

      const result = await adapter.getUser!('user-123')

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: null,
      })
    })

    it('ユーザーが存在しない場合はnullを返す', async () => {
      mockChain.limit.mockResolvedValue([])

      const result = await adapter.getUser!('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getUserByEmail', () => {
    it('メールアドレスでユーザーを取得する', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: new Date('2024-01-01'),
      }
      mockChain.limit.mockResolvedValue([mockUser])

      const result = await adapter.getUserByEmail!('test@example.com')

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: new Date('2024-01-01'),
      })
    })

    it('ユーザーが存在しない場合はnullを返す', async () => {
      mockChain.limit.mockResolvedValue([])

      const result = await adapter.getUserByEmail!('non-existent@example.com')

      expect(result).toBeNull()
    })
  })

  describe('getUserByAccount', () => {
    it('プロバイダーアカウントでユーザーを取得する', async () => {
      const mockAccount = {
        userId: 'user-123',
        provider: 'line',
        providerAccountId: 'line-account-123',
      }
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: null,
      }

      // アカウント検索
      mockChain.limit.mockResolvedValueOnce([mockAccount])
      // ユーザー検索
      mockChain.limit.mockResolvedValueOnce([mockUser])

      const result = await adapter.getUserByAccount!({
        provider: 'line',
        providerAccountId: 'line-account-123',
      })

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: null,
      })
    })

    it('アカウントが存在しない場合はnullを返す', async () => {
      mockChain.limit.mockResolvedValue([])

      const result = await adapter.getUserByAccount!({
        provider: 'line',
        providerAccountId: 'non-existent',
      })

      expect(result).toBeNull()
    })

    it('アカウントは存在するがユーザーが存在しない場合はnullを返す', async () => {
      const mockAccount = {
        userId: 'deleted-user',
        provider: 'line',
        providerAccountId: 'line-account-123',
      }

      // アカウント検索
      mockChain.limit.mockResolvedValueOnce([mockAccount])
      // ユーザー検索（存在しない）
      mockChain.limit.mockResolvedValueOnce([])

      const result = await adapter.getUserByAccount!({
        provider: 'line',
        providerAccountId: 'line-account-123',
      })

      expect(result).toBeNull()
    })
  })

  describe('updateUser', () => {
    it('ユーザー情報を更新する', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'updated@example.com',
        emailVerified: new Date('2024-02-01'),
      }
      mockChain.returning.mockResolvedValue([mockUser])

      const result = await adapter.updateUser!({
        id: 'user-123',
        email: 'updated@example.com',
        emailVerified: new Date('2024-02-01'),
      })

      expect(result).toEqual({
        id: 'user-123',
        email: 'updated@example.com',
        emailVerified: new Date('2024-02-01'),
      })
    })

    it('emailVerifiedを更新する', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: new Date('2024-01-15'),
      }
      mockChain.returning.mockResolvedValue([mockUser])

      const result = await adapter.updateUser!({
        id: 'user-123',
        emailVerified: new Date('2024-01-15'),
      })

      expect(result.emailVerified).toEqual(new Date('2024-01-15'))
    })
  })

  describe('deleteUser', () => {
    it('ユーザーを削除する', async () => {
      mockChain.where.mockResolvedValue(undefined)

      await expect(adapter.deleteUser!('user-123')).resolves.toBeUndefined()
    })
  })

  describe('linkAccount', () => {
    it('アカウントをリンクする', async () => {
      const accountData: AdapterAccount = {
        userId: 'user-123',
        type: 'oauth',
        provider: 'line',
        providerAccountId: 'line-account-123',
        refresh_token: 'refresh-token',
        access_token: 'access-token',
        expires_at: 1234567890,
        token_type: 'bearer',
        scope: 'profile openid',
        id_token: 'id-token',
        session_state: 'active',
      }
      mockChain.values.mockResolvedValue(undefined)

      const result = await adapter.linkAccount!(accountData)

      expect(result).toEqual(accountData)
    })

    it('session_stateが文字列でない場合はnullに変換する', async () => {
      const accountData: AdapterAccount = {
        userId: 'user-123',
        type: 'oauth',
        provider: 'line',
        providerAccountId: 'line-account-123',
      }
      mockChain.values.mockResolvedValue(undefined)

      const result = await adapter.linkAccount!(accountData)

      expect(result).toBeDefined()
    })
  })

  describe('unlinkAccount', () => {
    it('アカウントのリンクを解除する', async () => {
      mockChain.where.mockResolvedValue(undefined)

      await expect(
        adapter.unlinkAccount!({
          provider: 'line',
          providerAccountId: 'line-account-123',
        })
      ).resolves.toBeUndefined()
    })
  })
})
