'use client'

import { FormEvent } from 'react'
// import { useRouter } from 'next/navigation'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Button } from '@/components/atoms/Button'

/**
 * 会員登録情報入力ページのテンプレート
 * LINE認証後に表示される初期情報入力フォーム
 */
export function RegisterTemplate() {
  // const router = useRouter()

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
    // const formData = new FormData(e.currentTarget)

    // try {
    //   // ここでAPIに登録情報を送信する処理を実装
    //   // 登録完了後、ホームページへ
    //   router.push('/')
    // } catch (error) {
    //   console.error('登録エラー:', error)
    //   alert('登録に失敗しました')
    // }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 px-4 py-8">
      <div className="mx-auto w-full max-w-md space-y-6">
        {/* ヘッダー */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">会員登録</h1>
          <p className="mt-2 text-sm text-gray-600">
            プロフィール情報を入力してください
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
          <Input
            name="name"
            label="お名前"
            type="text"
            placeholder="山田太郎"
            required
          />

          <Input
            name="birthDate"
            label="生年月日"
            type="date"
            required
          />

          <Select
            name="areaId"
            label="活動エリア"
            options={areas}
            placeholder="エリアを選択してください"
            defaultValue=""
            required
          />

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
