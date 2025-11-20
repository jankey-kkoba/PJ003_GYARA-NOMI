/**
 * date ユーティリティのユニットテスト
 */

import { describe, it, expect } from 'vitest'
import { calculateAge } from '@/utils/date'

describe('calculateAge', () => {
  describe('基本的な年齢計算', () => {
    it('誕生日前の場合、年齢から1を引く', () => {
      // 現在: 2025-06-15、誕生日: 1990-07-01（誕生日前）
      const birthDate = new Date('1990-07-01')
      const baseDate = new Date('2025-06-15')

      const age = calculateAge(birthDate, baseDate)

      expect(age).toBe(34) // 2025 - 1990 - 1 = 34
    })

    it('誕生日当日の場合、正確な年齢を返す', () => {
      // 現在: 2025-07-01、誕生日: 1990-07-01（誕生日当日）
      const birthDate = new Date('1990-07-01')
      const baseDate = new Date('2025-07-01')

      const age = calculateAge(birthDate, baseDate)

      expect(age).toBe(35) // 2025 - 1990 = 35
    })

    it('誕生日後の場合、正確な年齢を返す', () => {
      // 現在: 2025-08-01、誕生日: 1990-07-01（誕生日後）
      const birthDate = new Date('1990-07-01')
      const baseDate = new Date('2025-08-01')

      const age = calculateAge(birthDate, baseDate)

      expect(age).toBe(35) // 2025 - 1990 = 35
    })
  })

  describe('月の境界ケース', () => {
    it('同じ月で日付が前の場合、年齢から1を引く', () => {
      // 現在: 2025-06-15、誕生日: 1990-06-20（同月で誕生日前）
      const birthDate = new Date('1990-06-20')
      const baseDate = new Date('2025-06-15')

      const age = calculateAge(birthDate, baseDate)

      expect(age).toBe(34) // 2025 - 1990 - 1 = 34
    })

    it('同じ月で日付が同じ場合、正確な年齢を返す', () => {
      // 現在: 2025-06-15、誕生日: 1990-06-15（誕生日当日）
      const birthDate = new Date('1990-06-15')
      const baseDate = new Date('2025-06-15')

      const age = calculateAge(birthDate, baseDate)

      expect(age).toBe(35) // 2025 - 1990 = 35
    })

    it('同じ月で日付が後の場合、正確な年齢を返す', () => {
      // 現在: 2025-06-20、誕生日: 1990-06-15（誕生日後）
      const birthDate = new Date('1990-06-15')
      const baseDate = new Date('2025-06-20')

      const age = calculateAge(birthDate, baseDate)

      expect(age).toBe(35) // 2025 - 1990 = 35
    })
  })

  describe('年の境界ケース', () => {
    it('年末生まれで年始に計算した場合、正しく計算する', () => {
      // 現在: 2025-01-15、誕生日: 1990-12-31（誕生日後）
      const birthDate = new Date('1990-12-31')
      const baseDate = new Date('2025-01-15')

      const age = calculateAge(birthDate, baseDate)

      expect(age).toBe(34) // 2025 - 1990 - 1 = 34（まだ誕生日前）
    })

    it('年始生まれで年末に計算した場合、正しく計算する', () => {
      // 現在: 2025-12-31、誕生日: 1990-01-01（誕生日後）
      const birthDate = new Date('1990-01-01')
      const baseDate = new Date('2025-12-31')

      const age = calculateAge(birthDate, baseDate)

      expect(age).toBe(35) // 2025 - 1990 = 35
    })
  })

  describe('特殊なケース', () => {
    it('0歳の場合も正しく計算する', () => {
      // 現在: 2025-06-15、誕生日: 2025-01-01（0歳）
      const birthDate = new Date('2025-01-01')
      const baseDate = new Date('2025-06-15')

      const age = calculateAge(birthDate, baseDate)

      expect(age).toBe(0)
    })

    it('うるう年生まれの場合も正しく計算する', () => {
      // 現在: 2025-03-01、誕生日: 2000-02-29（うるう年生まれ）
      const birthDate = new Date('2000-02-29')
      const baseDate = new Date('2025-03-01')

      const age = calculateAge(birthDate, baseDate)

      expect(age).toBe(25) // 2025 - 2000 = 25
    })

    it('100歳を超える場合も正しく計算する', () => {
      // 現在: 2025-06-15、誕生日: 1920-01-01（105歳）
      const birthDate = new Date('1920-01-01')
      const baseDate = new Date('2025-06-15')

      const age = calculateAge(birthDate, baseDate)

      expect(age).toBe(105) // 2025 - 1920 = 105
    })
  })

  describe('baseDateのデフォルト値', () => {
    it('baseDateを指定しない場合、現在日時で計算する', () => {
      // 10年前の誕生日
      const birthDate = new Date()
      birthDate.setFullYear(birthDate.getFullYear() - 10)

      const age = calculateAge(birthDate)

      expect(age).toBe(10)
    })
  })

  describe('実際のケース', () => {
    it('1990-01-01生まれの人の年齢を2025-11-20に計算する', () => {
      const birthDate = new Date('1990-01-01')
      const baseDate = new Date('2025-11-20')

      const age = calculateAge(birthDate, baseDate)

      expect(age).toBe(35)
    })

    it('1995-06-15生まれの人の年齢を2025-11-20に計算する', () => {
      const birthDate = new Date('1995-06-15')
      const baseDate = new Date('2025-11-20')

      const age = calculateAge(birthDate, baseDate)

      expect(age).toBe(30)
    })

    it('2000-12-31生まれの人の年齢を2025-11-20に計算する', () => {
      const birthDate = new Date('2000-12-31')
      const baseDate = new Date('2025-11-20')

      const age = calculateAge(birthDate, baseDate)

      expect(age).toBe(24) // 誕生日前
    })
  })
})
