import { CastDetailTemplate } from '@/features/cast/components/organisms/CastDetailTemplate'

type CastDetailPageProps = {
  params: Promise<{ castId: string }>
}

export default async function CastDetailPage({ params }: CastDetailPageProps) {
  const { castId } = await params
  return <CastDetailTemplate castId={castId} />
}
