import { db } from '@/libs/db'
import { soloMatchings } from '@/libs/db/schema/solo-matchings'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'

/**
 * ソロマッチング作成の入力パラメータ
 */
export type CreateSoloMatchingParams = {
  guestId: string
  castId: string
  proposedDate: Date
  proposedDuration: number
  proposedLocation: string
  hourlyRate: number
}

/**
 * ソロマッチングサービス
 * ソロマッチング関連のデータベース操作を提供
 */
export const soloMatchingService = {
  /**
   * ソロマッチングオファーを作成
   * @param params - マッチングオファー情報
   * @returns 作成されたソロマッチング
   */
  async createSoloMatching(params: CreateSoloMatchingParams): Promise<SoloMatching> {
    const { guestId, castId, proposedDate, proposedDuration, proposedLocation, hourlyRate } = params

    // 合計ポイントを計算（時給 × 時間）
    const totalPoints = Math.round((proposedDuration / 60) * hourlyRate)

    const [result] = await db
      .insert(soloMatchings)
      .values({
        guestId,
        castId,
        proposedDate,
        proposedDuration,
        proposedLocation,
        hourlyRate,
        totalPoints,
        chatRoomId: null, // チャット機能実装時に対応
      })
      .returning()

    // DB型からアプリケーション型に変換
    return {
      id: result.id,
      guestId: result.guestId,
      castId: result.castId,
      chatRoomId: result.chatRoomId,
      status: result.status,
      proposedDate: result.proposedDate,
      proposedDuration: result.proposedDuration,
      proposedLocation: result.proposedLocation,
      hourlyRate: result.hourlyRate,
      totalPoints: result.totalPoints,
      startedAt: result.startedAt,
      scheduledEndAt: result.scheduledEndAt,
      actualEndAt: result.actualEndAt,
      extensionMinutes: result.extensionMinutes ?? 0,
      extensionPoints: result.extensionPoints ?? 0,
      castRespondedAt: result.castRespondedAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }
  },
}
