'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { checkSession, logout, isProtectedRoute } from '@/lib/session'
import FaceUploadModal from '@/app/components/FaceUploadModal'

interface Venue {
  id: string
  name: string
  location: string
  path: string
}

export default function Home() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [sessionState, setSessionState] = useState({ authenticated: false, loading: true })
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isFaceUploadModalOpen, setIsFaceUploadModalOpen] = useState(false)
  const [faceInfo, setFaceInfo] = useState<any>(null)
  const router = useRouter()

  // 会場一覧データ
  const venueList: Venue[] = [
    { id: 'venue_01', name: '第1会場', location: '（4F ホールC）', path: '/gallery/venue_01' },
    { id: 'venue_02', name: '第2会場', location: '（7F ホールB7（1））', path: '/gallery/venue_02' },
    { id: 'venue_03', name: '第3会場', location: '（7F ホールB7（2）', path: '/gallery/venue_03' },
    { id: 'venue_04', name: '第4会場', location: '（5F ホールB5（1））', path: '/gallery/venue_04' },
    { id: 'venue_05', name: '第5会場', location: '（5F ホールB5（2）', path: '/gallery/venue_05' },
    { id: 'venue_06', name: '第6会場', location: '（7F ホールD7）', path: '/gallery/venue_06' },
    { id: 'venue_07', name: '第7会場', location: '（5F ホールD5）', path: '/gallery/venue_07' },
    { id: 'venue_08', name: '第8会場', location: '（1F ホールD1）', path: '/gallery/venue_08' },
    { id: 'venue_09', name: '第9会場', location: '（7F G701）', path: '/gallery/venue_09' },
    { id: 'venue_10', name: '第10会場', location: '（4F G409）', path: '/gallery/venue_10' },
    { id: 'venue_11', name: '学術展示会場', location: '（B2F ホールE）', path: '/gallery/venue_11' },
    { id: 'venue_12', name: '会長招宴', location: '', path: '/gallery/venue_12' },
    { id: 'venue_13', name: '器械展示会場・おもてなしコーナー・休憩スペース', location: '', path: '/gallery/venue_13' },
    { id: 'venue_14', name: '市民公開講座', location: '', path: '/gallery/venue_14' },
    { id: 'venue_15', name: '開会式・総会・閉会式', location: '', path: '/gallery/venue_15' },
  ]

  useEffect(() => {
    setVenues(venueList)
  }, [])

  // セッション状態を確認
  useEffect(() => {
    const verifySession = async () => {
      const state = await checkSession()
      setSessionState(state)
      
      // 顔情報を設定
      if (state.faceInfo) {
        setFaceInfo(state.faceInfo)
      }
      
      // 認証されていない場合はログインページにリダイレクト
      if (!state.authenticated) {
        router.push('/login')
      }
    }

    verifySession()
  }, [router])

  const handleVenueClick = (venue: Venue) => {
    if (sessionState.authenticated) {
      router.push(venue.path)
    } else {
      router.push('/login')
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const result = await logout()
      if (result.success) {
        router.push('/login')
      } else {
        console.error('ログアウトエラー:', result.error)
      }
    } catch (error) {
      console.error('ログアウトエラー:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  // ローディング中
  if (sessionState.loading) {
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
            <p>認証状態を確認中...</p>
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

  // 認証されていない場合
  if (!sessionState.authenticated) {
    return null // ログインページにリダイレクトされる
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
      
      <section id="upload">
        <dl>
          <dt>顔写真登録</dt>
          <dd>顔写真を登録すると、フォトギャラリー内の写真と登録された顔写真を照らし合わせ、一致した写真が絞り込んで表示されます。
          <p className="note">取り込まれた顔写真は、ユーザー情報とは一切紐付けられず、今回の写真照合のみに使用されます。照合完了後は速やかに破棄され、システム上に保存されることはありません。</p>
          </dd>
        </dl>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {faceInfo ? (
            <>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                padding: '8px 12px',
                backgroundColor: '#d4edda',
                color: '#155724',
                borderRadius: '4px',
                border: '1px solid #c3e6cb'
              }}>
                <span>✅ 顔写真登録済み</span>
                <span style={{ fontSize: '12px' }}>
                  (登録日: {new Date(faceInfo.registeredAt).toLocaleDateString()})
                </span>
              </div>
              <input 
                className="upload_btn" 
                type="button" 
                value="顔写真を再登録する" 
                onClick={() => setIsFaceUploadModalOpen(true)}
              />
            </>
          ) : (
            <input 
              className="upload_btn" 
              type="button" 
              value="顔写真を登録する" 
              onClick={() => setIsFaceUploadModalOpen(true)}
            />
          )}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{
              padding: '8px 16px',
              backgroundColor: isLoggingOut ? '#6c757d' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoggingOut ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.3s'
            }}
          >
            {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
          </button>
        </div>
      </section>
      
      <section id="wrapper">
        <div id="venue">
          {venues.map((venue) => (
            <div key={venue.id}>
              <a href="#" onClick={(e) => { e.preventDefault(); handleVenueClick(venue); }}>
                <p>
                  {venue.name}
                  {venue.location && <span>{venue.location}</span>}
                </p>
              </a>
            </div>
          ))}
        </div>
      </section>
      
      <footer>
        <p>&copy; 2025- The 129th Annual Meeting of the Japanese Ophthalmological Society.</p>
      </footer>
      
      <p id="pagetop"><a href="#"></a></p>

      {/* 顔写真登録モーダル */}
      <FaceUploadModal
        isOpen={isFaceUploadModalOpen}
        onClose={() => setIsFaceUploadModalOpen(false)}
        onSuccess={() => {
          console.log('顔写真が正常に登録されました')
          // セッション状態を再確認して顔情報を更新
          const verifySession = async () => {
            const state = await checkSession()
            if (state.faceInfo) {
              setFaceInfo(state.faceInfo)
            }
          }
          verifySession()
        }}
      />
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
