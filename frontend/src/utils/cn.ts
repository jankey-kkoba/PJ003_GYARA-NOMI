import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * TailwindCSSのクラス名をマージするユーティリティ関数
 * clsxとtailwind-mergeを組み合わせて使用
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
