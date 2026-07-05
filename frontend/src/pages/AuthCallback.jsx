import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { TOKEN_KEYS } from '../api'
import { useAuth } from '../context/AuthContext'

export default function AuthCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { updateUser } = useAuth()
  const [status, setStatus] = useState('Signing you in...')

  useEffect(() => {
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const isNew = params.get('is_new') === 'true' || params.get('is_new') === 'True'

    if (accessToken && refreshToken) {
      localStorage.setItem(TOKEN_KEYS.access, accessToken)
      localStorage.setItem(TOKEN_KEYS.refresh, refreshToken)

      // Fetch user profile to populate context and localStorage
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.data) {
            localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(res.data))
            updateUser(res.data)
          }
        })
        .catch(() => {})
        .finally(() => {
          setStatus('Done. Taking you in...')
          setTimeout(() => {
            navigate(isNew ? '/profile/edit' : '/feed', { replace: true })
          }, 800)
        })
    } else {
      setStatus('Something went wrong.')
      setTimeout(() => navigate('/auth'), 2000)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      background: '#0D0D0D',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"IBM Plex Mono", monospace',
      color: '#666666',
      fontSize: 13,
      gap: 16,
    }}>
      <p style={{
        color: '#F0F0F0',
        fontSize: 28,
        fontFamily: '"DM Serif Display", serif',
        margin: 0,
      }}>
        ShowUp.
      </p>
      <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {status}
      </p>
    </div>
  )
}
