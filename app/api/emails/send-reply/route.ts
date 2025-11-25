import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function getOriginalEmail(accessToken: string, emailId: string) {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  )

  const detail = await res.json()
  const headers = detail.payload?.headers || []

  const getHeader = (name: string) =>
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

  return {
    to: getHeader('from'),
    subject: getHeader('subject'),
    messageId: getHeader('message-id'),
    references: getHeader('references')
  }
}

function createEmailMessage(to: string, subject: string, body: string, threadId: string, messageId: string, references: string) {
  const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`

  const email = [
    `To: ${to}`,
    `Subject: ${replySubject}`,
    `In-Reply-To: ${messageId}`,
    `References: ${references || messageId}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body
  ].join('\r\n')

  return Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('gmail_access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { emailId, threadId, draft } = await request.json()

    const original = await getOriginalEmail(accessToken, emailId)

    const raw = createEmailMessage(
      original.to,
      original.subject,
      draft,
      threadId,
      original.messageId,
      original.references
    )

    const sendRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw, threadId })
      }
    )

    if (!sendRes.ok) {
      throw new Error('Failed to send email')
    }

    const markReadRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}/modify`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          removeLabelIds: ['UNREAD']
        })
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending reply:', error)
    return NextResponse.json(
      { error: 'Failed to send reply' },
      { status: 500 }
    )
  }
}
