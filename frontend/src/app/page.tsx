import { HomeTemplate } from '@/features/home/components/templates/HomeTemplate'

interface HomeProps {
  searchParams: Promise<{ login?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams
  const showLoginSuccessToast = params.login === 'success'

  return <HomeTemplate showLoginSuccessToast={showLoginSuccessToast} />
}
