import { eq, desc } from 'drizzle-orm'
import { db } from '@/libs/db'
import { castProfilePhotos } from '@/libs/db/schema/cast-profile-photos'
import type {
  CastProfilePhoto,
  CreateCastProfilePhotoData,
  UpdateCastProfilePhotoData,
} from '@/features/cast-profile-photo/types'

/**
 * キャストプロフィール写真のデータベースサービス
 * プロフィール写真のCRUD操作を提供
 */
export const photoService = {
  /**
   * キャストのプロフィール写真一覧を取得
   * @param castProfileId - キャストプロフィールID
   * @returns プロフィール写真一覧（表示順でソート）
   */
  async getPhotosByCastId(castProfileId: string): Promise<CastProfilePhoto[]> {
    const photos = await db
      .select()
      .from(castProfilePhotos)
      .where(eq(castProfilePhotos.castProfileId, castProfileId))
      .orderBy(castProfilePhotos.displayOrder)

    return photos.map((photo) => ({
      id: photo.id,
      castProfileId: photo.castProfileId,
      photoUrl: photo.photoUrl,
      displayOrder: photo.displayOrder,
      createdAt: new Date(photo.createdAt),
      updatedAt: new Date(photo.updatedAt),
    }))
  },

  /**
   * プロフィール写真を追加
   * @param data - プロフィール写真データ
   * @returns 作成されたプロフィール写真
   */
  async createPhoto(
    data: CreateCastProfilePhotoData
  ): Promise<CastProfilePhoto> {
    const [photo] = await db
      .insert(castProfilePhotos)
      .values({
        id: crypto.randomUUID(),
        castProfileId: data.castProfileId,
        photoUrl: data.photoUrl,
        displayOrder: data.displayOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return {
      id: photo.id,
      castProfileId: photo.castProfileId,
      photoUrl: photo.photoUrl,
      displayOrder: photo.displayOrder,
      createdAt: new Date(photo.createdAt),
      updatedAt: new Date(photo.updatedAt),
    }
  },

  /**
   * プロフィール写真を更新
   * @param photoId - プロフィール写真ID
   * @param data - 更新データ
   * @returns 更新されたプロフィール写真
   */
  async updatePhoto(
    photoId: string,
    data: UpdateCastProfilePhotoData
  ): Promise<CastProfilePhoto> {
    const [photo] = await db
      .update(castProfilePhotos)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(castProfilePhotos.id, photoId))
      .returning()

    if (!photo) {
      throw new Error('プロフィール写真が見つかりません')
    }

    return {
      id: photo.id,
      castProfileId: photo.castProfileId,
      photoUrl: photo.photoUrl,
      displayOrder: photo.displayOrder,
      createdAt: new Date(photo.createdAt),
      updatedAt: new Date(photo.updatedAt),
    }
  },

  /**
   * プロフィール写真を削除
   * @param photoId - プロフィール写真ID
   */
  async deletePhoto(photoId: string): Promise<void> {
    await db.delete(castProfilePhotos).where(eq(castProfilePhotos.id, photoId))
  },

  /**
   * 特定のキャストのプロフィール写真を全て削除
   * @param castProfileId - キャストプロフィールID
   */
  async deletePhotosByCastId(castProfileId: string): Promise<void> {
    await db
      .delete(castProfilePhotos)
      .where(eq(castProfilePhotos.castProfileId, castProfileId))
  },

  /**
   * プロフィール写真の枚数を取得
   * @param castProfileId - キャストプロフィールID
   * @returns 写真の枚数
   */
  async getPhotoCount(castProfileId: string): Promise<number> {
    const photos = await db
      .select()
      .from(castProfilePhotos)
      .where(eq(castProfilePhotos.castProfileId, castProfileId))

    return photos.length
  },

  /**
   * 次の表示順序を取得
   * @param castProfileId - キャストプロフィールID
   * @returns 次の表示順序
   */
  async getNextDisplayOrder(castProfileId: string): Promise<number> {
    const photos = await db
      .select()
      .from(castProfilePhotos)
      .where(eq(castProfilePhotos.castProfileId, castProfileId))
      .orderBy(desc(castProfilePhotos.displayOrder))
      .limit(1)

    if (photos.length === 0) {
      return 0
    }

    return photos[0].displayOrder + 1
  },
}
