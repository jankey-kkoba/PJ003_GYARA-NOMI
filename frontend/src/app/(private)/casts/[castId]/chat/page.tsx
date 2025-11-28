import { ChatTemplate } from '@/features/chat/components/templates/ChatTemplate'

type ChatPageProps = {
	params: Promise<{ castId: string }>
}

/**
 * キャストとのチャットページ
 */
export default async function ChatPage({ params }: ChatPageProps) {
	const { castId } = await params
	return <ChatTemplate castId={castId} />
}
