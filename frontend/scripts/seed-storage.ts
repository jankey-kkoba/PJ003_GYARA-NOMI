/**
 * Supabase Storage Seeder
 *
 * テスト用のキャストプロフィール画像をStorageにアップロードする
 * seed.sqlで定義されたパスに合わせて画像をアップロードする
 *
 * 使用方法:
 *   cd frontend && npm run db:seed-storage
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// .env.local から環境変数を読み込む
const envPath = path.resolve(__dirname, '../.env.local')
dotenv.config({ path: envPath })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.error('❌ 環境変数が設定されていません')
	console.error('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗')
	console.error('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗')
	process.exit(1)
}

// Service Roleキーでクライアントを作成（RLSをバイパス）
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const BUCKET_NAME = 'cast-profile-photos'

// テスト画像のディレクトリ
const TEST_IMAGES_DIR = path.resolve(__dirname, '../__tests__/test-data/images')

// テスト画像ファイル（ローテーションで使用）
const TEST_IMAGES = ['cast-profile-test.png', 'cast-profile-test2.png', 'cast-profile-test3.png']

// アップロードする画像のマッピングを生成
function generateUploadMappings() {
	const mappings: Array<{ sourceFile: string; targetPath: string }> = []

	// seed-user-cast-001: 3枚の写真
	mappings.push(
		{ sourceFile: 'cast-profile-test.png', targetPath: 'seed-user-cast-001/photo1.jpg' },
		{ sourceFile: 'cast-profile-test2.png', targetPath: 'seed-user-cast-001/photo2.jpg' },
		{ sourceFile: 'cast-profile-test3.png', targetPath: 'seed-user-cast-001/photo3.jpg' },
	)

	// seed-user-cast-002: 1枚の写真
	mappings.push({ sourceFile: 'cast-profile-test.png', targetPath: 'seed-user-cast-002/photo1.jpg' })

	// pagination用キャスト（20件）: 各1枚の写真
	for (let n = 1; n <= 20; n++) {
		const paddedN = n.toString().padStart(3, '0')
		// 3つのテスト画像をローテーションで使用
		const sourceFile = TEST_IMAGES[(n - 1) % TEST_IMAGES.length]
		mappings.push({
			sourceFile,
			targetPath: `seed-user-cast-page-${paddedN}/photo1.jpg`,
		})
	}

	return mappings
}

const UPLOAD_MAPPINGS = generateUploadMappings()

async function clearBucket(): Promise<void> {
	console.log('🗑️  既存のシードデータを削除中...')

	// シードデータのフォルダパスを生成
	const seedFolders: string[] = [
		'seed-user-cast-001',
		'seed-user-cast-002',
		// pagination用キャスト（20件）
		...Array.from({ length: 20 }, (_, i) => `seed-user-cast-page-${(i + 1).toString().padStart(3, '0')}`),
	]

	let totalDeleted = 0

	for (const folder of seedFolders) {
		const { data: files, error } = await supabase.storage.from(BUCKET_NAME).list(folder)

		if (error) {
			// フォルダが存在しない場合はスキップ
			continue
		}

		if (files && files.length > 0) {
			const filesToDelete = files.map((file) => `${folder}/${file.name}`)
			const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove(filesToDelete)

			if (deleteError) {
				console.warn(`⚠️  ファイル削除に失敗: ${deleteError.message}`)
			} else {
				totalDeleted += filesToDelete.length
			}
		}
	}

	console.log(`   削除完了: ${totalDeleted}件`)
}

async function uploadImages(): Promise<void> {
	console.log('📤 画像をアップロード中...')

	for (const mapping of UPLOAD_MAPPINGS) {
		const sourcePath = path.join(TEST_IMAGES_DIR, mapping.sourceFile)

		// ファイルの存在確認
		if (!fs.existsSync(sourcePath)) {
			console.error(`❌ ファイルが見つかりません: ${sourcePath}`)
			continue
		}

		// ファイルを読み込み
		const fileBuffer = fs.readFileSync(sourcePath)

		// MIMEタイプを決定（拡張子に関係なくPNGとして扱う）
		const contentType = 'image/png'

		// アップロード
		const { error } = await supabase.storage.from(BUCKET_NAME).upload(mapping.targetPath, fileBuffer, {
			contentType,
			upsert: true, // 既存ファイルを上書き
		})

		if (error) {
			console.error(`❌ アップロード失敗: ${mapping.targetPath}`)
			console.error(`   エラー: ${error.message}`)
		} else {
			console.log(`   ✓ ${mapping.sourceFile} → ${mapping.targetPath}`)
		}
	}
}

async function main(): Promise<void> {
	console.log('🌱 Storage Seeder 開始')
	console.log(`   Supabase URL: ${SUPABASE_URL}`)
	console.log(`   バケット: ${BUCKET_NAME}`)
	console.log('')

	try {
		// 既存のシードデータを削除
		await clearBucket()
		console.log('')

		// 画像をアップロード
		await uploadImages()
		console.log('')

		console.log('✅ Storage Seeder 完了')
	} catch (error) {
		console.error('❌ エラーが発生しました:', error)
		process.exit(1)
	}
}

main()
