/**
 * 誕生日から年齢を計算する
 * @param birthDate - 誕生日
 * @param baseDate - 基準日（デフォルトは現在日時）
 * @returns 年齢
 */
export function calculateAge(birthDate: Date, baseDate: Date = new Date()): number {
  let age = baseDate.getFullYear() - birthDate.getFullYear()
  const monthDiff = baseDate.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && baseDate.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}
