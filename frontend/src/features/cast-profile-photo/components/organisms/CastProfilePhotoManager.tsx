'use client'

import { PhotoUploader } from '@/features/cast-profile-photo/components/molecules/PhotoUploader'
import { PhotoGallery } from '@/features/cast-profile-photo/components/molecules/PhotoGallery'

type CastProfilePhotoManagerProps = {
  /** キャストID（現在のユーザー） */
  castId: string
}

/**
 * キャストプロフィール写真管理コンポーネント
 * 写真アップロードと一覧管理を提供
 */
export function CastProfilePhotoManager({
  castId,
}: CastProfilePhotoManagerProps) {
  return (
    <div className="space-y-8">
      {/* 写真アップロード */}
      <section>
        <h2 className="text-lg font-semibold mb-4">新しい写真を追加</h2>
        <PhotoUploader />
      </section>

      {/* 写真一覧 */}
      <section>
        <h2 className="text-lg font-semibold mb-4">登録済みの写真</h2>
        <PhotoGallery castId={castId} canDelete={true} />
      </section>
    </div>
  )
}
