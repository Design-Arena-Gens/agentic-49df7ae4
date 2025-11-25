'use client'

import { useState, useEffect } from 'react'

interface Email {
  id: string
  from: string
  subject: string
  snippet: string
  date: string
  status: 'draft' | 'auto-replied' | 'needs-attention'
  draft?: string
  threadId: string
}

interface Settings {
  autoReplyEnabled: boolean
  checkInterval: number
  apiKey: string
  replyContext: string
}

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emails, setEmails] = useState<Email[]>([])
  const [settings, setSettings] = useState<Settings>({
    autoReplyEnabled: false,
    checkInterval: 5,
    apiKey: '',
    replyContext: 'You are a professional assistant. Be polite and helpful.'
  })
  const [stats, setStats] = useState({
    total: 0,
    autoReplied: 0,
    drafts: 0,
    needsAttention: 0
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/status')
      const data = await res.json()
      setAuthenticated(data.authenticated)

      if (data.authenticated) {
        loadEmails()
      }
    } catch (err) {
      console.error('Auth check failed:', err)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/google')
      const data = await res.json()
      window.location.href = data.url
    } catch (err) {
      setError('Failed to initiate Google login')
      setLoading(false)
    }
  }

  const loadEmails = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/emails')
      if (!res.ok) throw new Error('Failed to load emails')

      const data = await res.json()
      setEmails(data.emails || [])
      updateStats(data.emails || [])
    } catch (err) {
      setError('Failed to load emails')
    } finally {
      setLoading(false)
    }
  }

  const updateStats = (emailList: Email[]) => {
    setStats({
      total: emailList.length,
      autoReplied: emailList.filter(e => e.status === 'auto-replied').length,
      drafts: emailList.filter(e => e.status === 'draft').length,
      needsAttention: emailList.filter(e => e.status === 'needs-attention').length
    })
  }

  const generateDraft = async (emailId: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/emails/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, context: settings.replyContext })
      })

      if (!res.ok) throw new Error('Failed to generate draft')

      const data = await res.json()
      setEmails(prev => prev.map(e =>
        e.id === emailId ? { ...e, draft: data.draft, status: 'draft' } : e
      ))
      setSuccess('Draft generated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to generate draft')
    } finally {
      setLoading(false)
    }
  }

  const sendReply = async (emailId: string, draft: string) => {
    setLoading(true)
    setError('')
    try {
      const email = emails.find(e => e.id === emailId)
      if (!email) throw new Error('Email not found')

      const res = await fetch('/api/emails/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId,
          threadId: email.threadId,
          draft
        })
      })

      if (!res.ok) throw new Error('Failed to send reply')

      setEmails(prev => prev.map(e =>
        e.id === emailId ? { ...e, status: 'auto-replied' } : e
      ))
      setSuccess('Reply sent successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to send reply')
    } finally {
      setLoading(false)
    }
  }

  const startMonitoring = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/emails/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: true,
          autoReply: settings.autoReplyEnabled,
          interval: settings.checkInterval,
          context: settings.replyContext
        })
      })

      if (!res.ok) throw new Error('Failed to start monitoring')

      setSuccess('Monitoring started! Checking emails every ' + settings.checkInterval + ' minutes')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to start monitoring')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setAuthenticated(false)
      setEmails([])
    } catch (err) {
      setError('Failed to logout')
    }
  }

  if (!authenticated) {
    return (
      <div className="container">
        <div className="header">
          <h1>Email Agent</h1>
          <p>AI-Powered Email Assistant</p>
        </div>
        <div className="card auth-section">
          <h2>Welcome!</h2>
          <p style={{ margin: '1rem 0', color: '#666' }}>
            Connect your Gmail account to start monitoring emails and generating automated replies.
          </p>
          <button
            className="btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect Gmail Account'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Email Agent</h1>
        <p>AI-Powered Email Assistant</p>
        <button
          className="btn btn-secondary"
          onClick={handleLogout}
          style={{ marginTop: '1rem' }}
        >
          Logout
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Emails</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.autoReplied}</div>
          <div className="stat-label">Auto-Replied</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.drafts}</div>
          <div className="stat-label">Drafts Ready</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.needsAttention}</div>
          <div className="stat-label">Needs Attention</div>
        </div>
      </div>

      <div className="card">
        <h2>Settings</h2>
        <div className="settings-form">
          <div className="form-group">
            <label>Claude API Key</label>
            <input
              type="password"
              placeholder="sk-ant-..."
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Reply Context (Instructions for AI)</label>
            <textarea
              value={settings.replyContext}
              onChange={(e) => setSettings({ ...settings, replyContext: e.target.value })}
              placeholder="e.g., You are a friendly customer support agent..."
            />
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="autoReply"
              checked={settings.autoReplyEnabled}
              onChange={(e) => setSettings({ ...settings, autoReplyEnabled: e.target.checked })}
            />
            <label htmlFor="autoReply">Enable auto-reply for basic emails</label>
          </div>

          <div className="form-group">
            <label>Check Interval (minutes)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={settings.checkInterval}
              onChange={(e) => setSettings({ ...settings, checkInterval: parseInt(e.target.value) })}
            />
          </div>

          <div className="action-buttons">
            <button
              className="btn"
              onClick={loadEmails}
              disabled={loading}
            >
              Refresh Emails
            </button>
            <button
              className="btn"
              onClick={startMonitoring}
              disabled={loading || !settings.apiKey}
            >
              Start Monitoring
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Recent Emails</h2>
        {loading && <div className="loading">Loading emails...</div>}

        <div className="email-list">
          {emails.length === 0 && !loading && (
            <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
              No emails found. Click "Refresh Emails" to load your inbox.
            </p>
          )}

          {emails.map(email => (
            <div key={email.id} className="email-item">
              <div className="email-header">
                <div>
                  <div className="email-from">{email.from}</div>
                  <div className="email-subject">{email.subject}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="email-date">{email.date}</div>
                  <span className={`status-badge status-${email.status}`}>
                    {email.status === 'auto-replied' && 'Auto-Replied'}
                    {email.status === 'draft' && 'Draft Ready'}
                    {email.status === 'needs-attention' && 'Needs Attention'}
                  </span>
                </div>
              </div>

              <div className="email-snippet">{email.snippet}</div>

              {email.draft && (
                <div className="draft-section">
                  <span className="draft-label">AI Generated Draft:</span>
                  <div className="draft-text">{email.draft}</div>
                  {email.status === 'draft' && (
                    <button
                      className="btn"
                      style={{ marginTop: '1rem' }}
                      onClick={() => sendReply(email.id, email.draft!)}
                      disabled={loading}
                    >
                      Send This Reply
                    </button>
                  )}
                </div>
              )}

              {!email.draft && email.status !== 'auto-replied' && (
                <button
                  className="btn btn-secondary"
                  onClick={() => generateDraft(email.id)}
                  disabled={loading || !settings.apiKey}
                >
                  Generate Draft Reply
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
