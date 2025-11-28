import type { MDXComponents } from 'mdx/types'

/**
 * MDXで使用するカスタムコンポーネントを定義
 * ここで定義したコンポーネントは全てのMDXファイルで使用可能
 *
 * @see https://nextjs.org/docs/app/building-your-application/configuring/mdx
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // 見出しのスタイリング
    h1: ({ children }) => (
      <h1 className="scroll-m-20 text-3xl font-bold tracking-tight mb-6">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight mt-10 mb-4">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="scroll-m-20 text-xl font-semibold tracking-tight mt-8 mb-3">
        {children}
      </h3>
    ),
    // 段落
    p: ({ children }) => (
      <p className="leading-7 not-first:mt-4 text-muted-foreground">
        {children}
      </p>
    ),
    // リスト
    ul: ({ children }) => (
      <ul className="my-4 ml-6 list-disc [&>li]:mt-2">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="my-4 ml-6 list-decimal [&>li]:mt-2">{children}</ol>
    ),
    // リンク
    a: ({ href, children }) => (
      <a
        href={href}
        className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
      >
        {children}
      </a>
    ),
    // コードブロック
    code: ({ children }) => (
      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="mb-4 mt-4 overflow-x-auto rounded-lg bg-muted p-4">
        {children}
      </pre>
    ),
    // 引用
    blockquote: ({ children }) => (
      <blockquote className="mt-6 border-l-2 border-primary pl-6 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
    // 水平線
    hr: () => <hr className="my-8 border-border" />,
    // 既存のコンポーネントをマージ
    ...components,
  }
}
