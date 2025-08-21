'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { checkSession, logout, isProtectedRoute } from '@/lib/session'
import { FaceUploadProvider, useFaceUpload } from '@/app/components/FaceUploadProvider'
import MVSection from '@/app/components/MVSection'

interface Venue {
  id: string
  name: string
  location: string
  path: string
}

function HomeContent() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [sessionState, setSessionState] = useState({ authenticated: false, loading: true })
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [faceInfo, setFaceInfo] = useState<any>(null)
  const [isUploadSectionExpanded, setIsUploadSectionExpanded] = useState(false)
  const router = useRouter()
  const { openFaceUploadModal } = useFaceUpload()

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

  const handleFaceUploadSuccess = () => {
    console.log('顔写真が正常に登録されました')
    // セッション状態を再確認して顔情報を更新
    const verifySession = async () => {
      const state = await checkSession()
      if (state.faceInfo) {
        setFaceInfo(state.faceInfo)
      }
    }
    verifySession()
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
      <MVSection 
        onLogout={handleLogout} 
        isLoggingOut={isLoggingOut} 
      />
      
      <section id="upload">
        <div className="upload-header" onClick={() => setIsUploadSectionExpanded(!isUploadSectionExpanded)}>
          <h3>顔写真登録</h3>
          <span className={`expand-icon ${isUploadSectionExpanded ? 'expanded' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
        
        <div className={`upload-content ${isUploadSectionExpanded ? 'expanded' : ''}`}>
          <dl>
            <dd>
              顔写真を登録すると、フォトギャラリー内の写真と登録された顔写真を照らし合わせ、一致した写真が絞り込んで表示されます。
              <br /><br />
              <p className="note">
                取り込まれた顔写真は、ユーザー情報とは一切紐付けられず、今回の写真照合のみに使用されます。照合完了後は速やかに破棄され、システム上に保存されることはありません。
              </p>
            </dd>
          </dl>
          <div className="upload-button-container">
            {faceInfo ? (
              <input 
                className="upload_btn" 
                type="button" 
                value="顔写真を再登録する" 
                onClick={openFaceUploadModal}
              />
            ) : (
              <input 
                className="upload_btn" 
                type="button" 
                value="顔写真を登録する" 
                onClick={openFaceUploadModal}
              />
            )}
          </div>
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
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .top-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: transparent;
          z-index: 1000;
          transition: all 0.3s ease;
        }
        
        #mv {
          position: relative;
        }
        
        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          height: 60px;
          box-sizing: border-box;
        }
        
        .nav-brand {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          font-family: 'Noto Sans JP', sans-serif;
        }
        
        .nav-menu {
          display: flex;
          gap: 15px;
          align-items: center;
          padding-right: 0;
          flex-wrap: nowrap;
        }
        
        .nav-item {
          background: none;
          border: none;
          padding: 6px 12px;
          font-size: 14px;
          color: #333;
          cursor: pointer;
          border-radius: 20px;
          transition: all 0.3s ease;
          font-family: 'Noto Sans JP', sans-serif;
          position: relative;
          white-space: nowrap;
        }
        
        .nav-item:hover {
          background: rgba(0, 123, 255, 0.1);
          color: #007bff;
        }
        
        .nav-item.logout-btn {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
        }
        
        .nav-item.logout-btn:hover {
          background: rgba(220, 53, 69, 0.2);
        }
        
        .nav-item.logout-btn:disabled {
          background: rgba(108, 117, 125, 0.1);
          color: #6c757d;
          cursor: not-allowed;
        }
        
        .mobile-menu-btn {
          display: none;
          flex-direction: column;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          gap: 4px;
        }
        
        .menu-line {
          width: 24px;
          height: 2px;
          background: #333;
          transition: all 0.3s ease;
          border-radius: 1px;
        }
        
        .menu-line.open:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }
        
        .menu-line.open:nth-child(2) {
          opacity: 0;
        }
        
        .menu-line.open:nth-child(3) {
          transform: rotate(-45deg) translate(7px, -6px);
        }
        
        .mobile-menu {
          display: none;
          flex-direction: column;
          background: transparent;
          border-top: none;
          padding: 20px;
          gap: 15px;
        }
        
        .mobile-menu.open {
          display: flex;
        }
        
        .mobile-nav-item {
          background: none;
          border: none;
          padding: 15px 20px;
          font-size: 16px;
          color: #333;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.3s ease;
          text-align: left;
          font-family: 'Noto Sans JP', sans-serif;
        }
        
        .mobile-nav-item:hover {
          background: rgba(0, 123, 255, 0.1);
          color: #007bff;
        }
        
        .mobile-nav-item.logout-btn {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          text-align: center;
        }
        
        .mobile-nav-item.logout-btn:hover {
          background: rgba(220, 53, 69, 0.2);
        }
        
        .mobile-nav-item.logout-btn:disabled {
          background: rgba(108, 117, 125, 0.1);
          color: #6c757d;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .nav-menu {
            display: none;
          }
          
          .mobile-menu-btn {
            display: flex;
            margin-left: auto;
            background: transparent;
            transition: background 0.3s ease;
          }
          
          .mobile-menu-btn:hover {
            background: rgba(255, 255, 255, 0.7);
          }
          
          .nav-container {
            height: 50px;
            padding: 0 15px;
            justify-content: flex-end;
            background: transparent;
            transition: background 0.3s ease;
          }
          
          .nav-brand {
            font-size: 14px;
          }
          
          .mobile-menu {
            background: transparent;
          }
          
          .mobile-menu.open {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(5px);
          }
          
          .top-nav:has(.mobile-menu.open) {
            background: rgba(255, 255, 255, 0.7);
          }
          
          .top-nav:has(.mobile-menu.open) .nav-container {
            background: rgba(255, 255, 255, 0.7);
          }
          
          .top-nav:has(.mobile-menu.open) .mobile-menu-btn {
            background: rgba(255, 255, 255, 0.7);
          }
        }
        
        @media (max-width: 480px) {
          .nav-container {
            padding: 0 10px;
          }
        }
        
        /* アコーディオン形式のアップロードセクション */
        .upload-header {
          display: none;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid #e9ecef;
        }
        
        .upload-header:hover {
          background: #e9ecef;
        }
        
        .upload-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
        
        .expand-icon {
          transition: transform 0.3s ease;
          color: #6c757d;
        }
        
        .expand-icon.expanded {
          transform: rotate(180deg);
        }
        
        .upload-content {
          max-height: none;
          overflow: visible;
          transition: max-height 0.3s ease, padding 0.3s ease;
          padding: 20px;
        }
        
        @media (min-width: 769px) {
          .upload-header {
            display: none;
          }
          
          .upload-content {
            max-height: none;
            overflow: visible;
            padding: 20px;
          }
        }
        
        @media (max-width: 768px) {
          .upload-header {
            display: flex;
          }
          
          .upload-content {
            max-height: 0;
            overflow: hidden;
            padding: 0 20px;
          }
          
          .upload-content.expanded {
            max-height: 500px;
            padding: 20px;
          }
        }
        
        .upload-button-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 20px;
        }
      `}</style>
    </div>
  )
}

export default function Home() {
  return <HomeContent />
}
