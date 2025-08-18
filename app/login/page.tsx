'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginConfig, setLoginConfig] = useState<any>(null)
  const router = useRouter()

  // ログイン設定を取得
  useEffect(() => {
    const fetchLoginConfig = async () => {
      try {
        const response = await fetch('/api/auth/config')
        if (response.ok) {
          const config = await response.json()
          setLoginConfig(config)
        }
      } catch (error) {
        console.error('ログイン設定の取得に失敗しました:', error)
      }
    }

    fetchLoginConfig()
  }, [])

  // セッション確認
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/check')
        if (response.ok) {
          const result = await response.json()
          if (result.authenticated) {
            // 既にログイン済みの場合は会場一覧ページにリダイレクト
            router.push(loginConfig?.redirectUrl || '/')
          }
        }
      } catch (error) {
        console.error('セッション確認に失敗しました:', error)
      }
    }

    if (loginConfig) {
      checkSession()
    }
  }, [loginConfig, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // ログイン成功 - 会場一覧ページにリダイレクト
        router.push(result.redirectUrl || '/')
      } else {
        // ログイン失敗
        setError(result.error || 'ログインに失敗しました')
      }
    } catch (error) {
      console.error('ログインエラー:', error)
      setError('ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (!loginConfig) {
    return (
      <div id="container">
        <section id="mv">
          <div>
            <h1><img src="/images/title.svg" alt="第129回日本眼科学会総会 フォトギャラリー"/></h1>
            <div>
              <p><img src="/images/date.svg" alt="会期：2025年4月17日（木）～4月20日（日）"/></p>
              <p><img src="/images/venue.svg" alt="会場：東京国際フォーラム"/></p>
            </div>
          </div>
        </section>
        
        <section id="wrapper">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              border: '3px solid #f3f3f3', 
              borderTop: '3px solid #007bff', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>設定を読み込み中...</p>
          </div>
        </section>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div id="container">
      <section id="mv">
        <div>
          <h1><img src="/images/title.svg" alt="第129回日本眼科学会総会 フォトギャラリー"/></h1>
          <div>
            <p><img src="/images/date.svg" alt="会期：2025年4月17日（木）～4月20日（日）"/></p>
            <p><img src="/images/venue.svg" alt="会場：東京国際フォーラム"/></p>
          </div>
        </div>
      </section>
      
      <section id="wrapper">
        <form name="form" onSubmit={handleSubmit}>
          <p>パスワードを入力後「ログイン」ボタンをクリックし、ログインしてください。</p>
          <div id="form_box">
            <p className="el_formTtl">パスワード：</p>
            <p><input type="password" name="pass" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} /></p>
            <p><input type="button" value="ログイン" onClick={handleSubmit} disabled={isLoading} /></p>
          </div>
          {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>{error}</p>}
        </form>
      </section>
      
      <footer>
        <p>&copy; 2025- The 129th Annual Meeting of the Japanese Ophthalmological Society.</p>
      </footer>
    </div>
  )
} 