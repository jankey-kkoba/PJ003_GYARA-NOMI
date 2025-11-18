'use client'

import { FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

/**
 * ユーザータイプ
 */
type UserType = 'guest' | 'cast'

/**
 * RegisterTemplateのProps
 */
type RegisterTemplateProps = {
  userType: UserType
}

/**
 * ユーザータイプに応じた表示設定
 */
const userTypeConfig = {
  guest: {
    title: 'ゲスト会員登録',
    description: 'ゲストとしてプロフィール情報を入力してください',
  },
  cast: {
    title: 'キャスト会員登録',
    description: 'キャストとしてプロフィール情報を入力してください',
  },
}

/**
 * 会員登録情報入力ページのテンプレート
 * LINE認証後に表示される初期情報入力フォーム
 */
export function RegisterTemplate({ userType }: RegisterTemplateProps) {
  const config = userTypeConfig[userType]
  // モックのエリアデータ
  const areas = [
    { value: 'tokyo', label: '東京' },
    { value: 'osaka', label: '大阪' },
    { value: 'nagoya', label: '名古屋' },
    { value: 'fukuoka', label: '福岡' },
    { value: 'sapporo', label: '札幌' },
  ]

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('登録フォームが送信されました')
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 px-4 py-8">
      <div className="mx-auto w-full max-w-md space-y-6">
        {/* ヘッダー */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {config.description}
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
          <div className="space-y-2">
            <Label htmlFor="name">お名前</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="山田太郎"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">生年月日</Label>
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="areaId">活動エリア</Label>
            <Select name="areaId" required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="エリアを選択してください" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.value} value={area.value}>
                    {area.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" size="lg">
            登録する
          </Button>
        </form>

        <p className="text-center text-xs text-gray-500">
          入力した情報は後から変更できます
        </p>
      </div>
    </div>
  )
}
