import { redirect } from 'next/navigation'

/**
 * キャストプロフィール編集ページ（旧）
 * 共通のプロフィール編集ページへリダイレクト
 */
export default function CastProfileEditPage() {
	redirect('/profile/edit')
}
