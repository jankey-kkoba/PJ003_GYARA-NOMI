import { describe, it, expect, vi, beforeEach } from 'vitest'
import { storageService } from '@/features/cast-profile-photo/services/storageService'

// Supabaseクライアントをモック
vi.mock('@/libs/supabase/server', () => ({
	createClient: vi.fn(),
}))

type MockSupabaseStorage = {
	from: ReturnType<typeof vi.fn>
}

type MockSupabase = {
	storage: MockSupabaseStorage
}

describe('storageService (unit)', () => {
	let mockSupabase: MockSupabase
	let mockCreateClient: ReturnType<typeof vi.fn>

	beforeEach(async () => {
		// Supabaseクライアントのモックをリセット
		mockSupabase = {
			storage: {
				from: vi.fn(),
			},
		}

		const { createClient } = await import('@/libs/supabase/server')
		mockCreateClient = vi.mocked(createClient)
		mockCreateClient.mockResolvedValue(mockSupabase)
	})

	describe('uploadPhoto', () => {
		it('正常にファイルをアップロードできる', async () => {
			const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
			const castProfileId = 'test-cast-id'

			const mockUpload = vi.fn().mockResolvedValue({
				data: { path: `${castProfileId}/123_abc.jpg` },
				error: null,
			})

			const mockGetPublicUrl = vi.fn().mockReturnValue({
				data: { publicUrl: 'https://example.com/storage/photo.jpg' },
			})

			mockSupabase.storage.from.mockReturnValue({
				upload: mockUpload,
				getPublicUrl: mockGetPublicUrl,
			})

			const result = await storageService.uploadPhoto(castProfileId, mockFile)

			expect(mockSupabase.storage.from).toHaveBeenCalledWith(
				'cast-profile-photos',
			)
			expect(mockUpload).toHaveBeenCalled()
			expect(result).toEqual({
				photoUrl: `${castProfileId}/123_abc.jpg`,
				publicUrl: 'https://example.com/storage/photo.jpg',
			})
		})

		it('アップロードエラー時に例外をスローする', async () => {
			const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
			const castProfileId = 'test-cast-id'

			const mockUpload = vi.fn().mockResolvedValue({
				data: null,
				error: { message: 'Upload failed' },
			})

			mockSupabase.storage.from.mockReturnValue({
				upload: mockUpload,
			})

			await expect(
				storageService.uploadPhoto(castProfileId, mockFile),
			).rejects.toThrow('画像のアップロードに失敗しました: Upload failed')
		})

		it('ファイル名にタイムスタンプとランダム文字列が含まれる', async () => {
			const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
			const castProfileId = 'test-cast-id'

			let uploadedFileName = ''
			const mockUpload = vi.fn().mockImplementation((fileName: string) => {
				uploadedFileName = fileName
				return Promise.resolve({
					data: { path: fileName },
					error: null,
				})
			})

			const mockGetPublicUrl = vi.fn().mockReturnValue({
				data: { publicUrl: 'https://example.com/storage/photo.jpg' },
			})

			mockSupabase.storage.from.mockReturnValue({
				upload: mockUpload,
				getPublicUrl: mockGetPublicUrl,
			})

			await storageService.uploadPhoto(castProfileId, mockFile)

			// ファイル名の形式をチェック: {castProfileId}/{timestamp}_{random}.{ext}
			expect(uploadedFileName).toMatch(
				new RegExp(`^${castProfileId}/\\d+_[a-z0-9]+\\.jpg$`),
			)
		})
	})

	describe('deletePhoto', () => {
		it('正常にファイルを削除できる', async () => {
			const photoUrl = 'test-cast-id/photo.jpg'

			const mockRemove = vi.fn().mockResolvedValue({
				data: null,
				error: null,
			})

			mockSupabase.storage.from.mockReturnValue({
				remove: mockRemove,
			})

			await storageService.deletePhoto(photoUrl)

			expect(mockSupabase.storage.from).toHaveBeenCalledWith(
				'cast-profile-photos',
			)
			expect(mockRemove).toHaveBeenCalledWith([photoUrl])
		})

		it('削除エラー時に例外をスローする', async () => {
			const photoUrl = 'test-cast-id/photo.jpg'

			const mockRemove = vi.fn().mockResolvedValue({
				data: null,
				error: { message: 'Delete failed' },
			})

			mockSupabase.storage.from.mockReturnValue({
				remove: mockRemove,
			})

			await expect(storageService.deletePhoto(photoUrl)).rejects.toThrow(
				'画像の削除に失敗しました: Delete failed',
			)
		})
	})

	describe('deletePhotos', () => {
		it('複数のファイルを削除できる', async () => {
			const photoUrls = ['test-cast-id/photo1.jpg', 'test-cast-id/photo2.jpg']

			const mockRemove = vi.fn().mockResolvedValue({
				data: null,
				error: null,
			})

			mockSupabase.storage.from.mockReturnValue({
				remove: mockRemove,
			})

			await storageService.deletePhotos(photoUrls)

			expect(mockSupabase.storage.from).toHaveBeenCalledWith(
				'cast-profile-photos',
			)
			expect(mockRemove).toHaveBeenCalledWith(photoUrls)
		})
	})

	describe('getPublicUrl', () => {
		it('正しい公開URLを生成する', () => {
			const photoUrl = 'test-cast-id/photo.jpg'
			const expectedUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cast-profile-photos/${photoUrl}`

			const publicUrl = storageService.getPublicUrl(photoUrl)

			expect(publicUrl).toBe(expectedUrl)
		})
	})
})
