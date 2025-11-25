import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

async function getEmailContent(accessToken: string, emailId: string) {
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

  let body = detail.snippet || ''

  if (detail.payload?.parts) {
    const textPart = detail.payload.parts.find((p: any) => p.mimeType === 'text/plain')
    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, 'base64').toString('utf-8')
    }
  } else if (detail.payload?.body?.data) {
    body = Buffer.from(detail.payload.body.data, 'base64').toString('utf-8')
  }

  return {
    from: getHeader('from'),
    subject: getHeader('subject'),
    body
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('gmail_access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { emailId, context } = await request.json()

    const email = await getEmailContent(accessToken, emailId)

    const apiKey = request.headers.get('x-api-key') || process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Claude API key not provided' },
        { status: 400 }
      )
    }

    const anthropic = new Anthropic({ apiKey })

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are an email assistant. Generate a professional reply to this email.

Context/Instructions: ${context || 'Be professional and helpful.'}

Email From: ${email.from}
Subject: ${email.subject}

Email Body:
${email.body}

Generate a clear, professional reply. Only output the reply text itself, no subject line or signatures.`
        }
      ]
    })

    const draft = message.content[0].type === 'text' ? message.content[0].text : ''

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('Error generating draft:', error)
    return NextResponse.json(
      { error: 'Failed to generate draft' },
      { status: 500 }
    )
  }
}
