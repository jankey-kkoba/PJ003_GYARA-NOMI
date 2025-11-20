'use client'

import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

/**
 * ページネーションのプロパティ
 */
type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

/**
 * ページネーションコンポーネント
 * shadcn/uiのPaginationコンポーネントを使用
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  // ページ番号の配列を生成
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5 // 表示する最大ページ数

    if (totalPages <= maxVisible) {
      // 総ページ数が少ない場合はすべて表示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 総ページ数が多い場合は省略表示
      if (currentPage <= 3) {
        // 最初の方のページ
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // 最後の方のページ
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // 中間のページ
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <PaginationRoot>
      <PaginationContent>
        {/* 前へボタン */}
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (currentPage > 1) {
                onPageChange(currentPage - 1)
              }
            }}
            aria-disabled={currentPage === 1}
            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>

        {/* ページ番号 */}
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          }

          const pageNumber = page as number
          const isActive = pageNumber === currentPage

          return (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(pageNumber)
                }}
                isActive={isActive}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          )
        })}

        {/* 次へボタン */}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (currentPage < totalPages) {
                onPageChange(currentPage + 1)
              }
            }}
            aria-disabled={currentPage === totalPages}
            className={
              currentPage === totalPages ? 'pointer-events-none opacity-50' : ''
            }
          />
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  )
}
