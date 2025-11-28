import type { NextConfig } from 'next'
import createMDX from '@next/mdx'

const nextConfig: NextConfig = {
	// .mdx ファイルをページとして扱う
	pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
}

const withMDX = createMDX({
	// 必要に応じてMarkdownプラグインを追加可能
	// options: {
	//   remarkPlugins: [],
	//   rehypePlugins: [],
	// },
})

export default withMDX(nextConfig)
