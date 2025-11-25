import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

async function getGmailMessages(accessToken: string) {
  try {
    const messagesRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=is:unread',
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    )

    if (!messagesRes.ok) {
      throw new Error('Failed to fetch messages')
    }

    const messagesData = await messagesRes.json()
    const messages = messagesData.messages || []

    const emailDetails = await Promise.all(
      messages.map(async (msg: any) => {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        )

        const detail = await detailRes.json()
        const headers = detail.payload?.headers || []

        const getHeader = (name: string) =>
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

        return {
          id: detail.id,
          threadId: detail.threadId,
          from: getHeader('from'),
          subject: getHeader('subject') || '(No Subject)',
          snippet: detail.snippet || '',
          date: new Date(parseInt(detail.internalDate)).toLocaleString(),
          status: 'needs-attention' as const,
          body: detail.snippet
        }
      })
    )

    return emailDetails
  } catch (error) {
    console.error('Error fetching Gmail messages:', error)
    throw error
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('gmail_access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const emails = await getGmailMessages(accessToken)

    return NextResponse.json({ emails })
  } catch (error) {
    console.error('Error in emails route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    )
  }
}
