'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateUserProfile } from '@/features/user/hooks/useUserProfile'

type BasicInfoFormProps = {
	/** 現在の名前 */
	defaultName: string
	/** 現在の生年月日（YYYY-MM-DD形式） */
	defaultBirthDate: string
}

/**
 * 基本情報編集フォーム（名前、生年月日）
 * キャスト・ゲスト共通
 */
export function BasicInfoForm({
	defaultName,
	defaultBirthDate,
}: BasicInfoFormProps) {
	const [name, setName] = useState(defaultName)
	const [birthDate, setBirthDate] = useState(defaultBirthDate)
	const updateMutation = useUpdateUserProfile()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await updateMutation.mutateAsync({ name, birthDate })
			alert('基本情報を更新しました')
		} catch {
			// エラーはmutationのonErrorで処理される
		}
	}

	const isChanged = name !== defaultName || birthDate !== defaultBirthDate

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="name">名前</Label>
				<Input
					id="name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="名前を入力してください"
					required
					maxLength={100}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="birthDate">生年月日</Label>
				<Input
					id="birthDate"
					type="date"
					value={birthDate}
					onChange={(e) => setBirthDate(e.target.value)}
					required
				/>
			</div>

			{updateMutation.isError && (
				<p className="text-sm text-destructive">
					{updateMutation.error?.message || '更新に失敗しました'}
				</p>
			)}

			<Button type="submit" disabled={!isChanged || updateMutation.isPending}>
				{updateMutation.isPending ? '更新中...' : '更新する'}
			</Button>
		</form>
	)
}
