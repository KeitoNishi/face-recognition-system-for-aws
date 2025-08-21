'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/app/hooks/useSession'
import { FaceUploadProvider, useFaceUpload } from '@/app/components/FaceUploadProvider'
import MVSection from '@/app/components/MVSection'
import { VENUE_LIST } from '@/app/config/venues'
import { VenueInfo } from '@/app/types'

function HomeContent() {
  const [venues, setVenues] = useState<VenueInfo[]>([])
  const [faceInfo, setFaceInfo] = useState<any>(null)
  const [isUploadSectionExpanded, setIsUploadSectionExpanded] = useState(false)
  const router = useRouter()
  const { openFaceUploadModal } = useFaceUpload()
  const { sessionState, isLoggingOut, handleLogout } = useSession()

  useEffect(() => {
    setVenues(VENUE_LIST)
  }, [])

  // セッション状態が更新されたら顔情報を更新
  useEffect(() => {
    if (sessionState.faceInfo) {
      setFaceInfo(sessionState.faceInfo)
    }
  }, [sessionState.faceInfo])

  const handleVenueClick = (venue: VenueInfo) => {
    if (sessionState.authenticated) {
      window.location.href = venue.path
    } else {
      window.location.href = '/login'
    }
  }

  const handleFaceUploadSuccess = () => {
    console.log('顔写真が正常に登録されました')
    // セッション状態を再確認して顔情報を更新
    if (sessionState.faceInfo) {
      setFaceInfo(sessionState.faceInfo)
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

  // 認証されていない場合（ローディング中は除く）
  if (!sessionState.authenticated && !sessionState.loading) {
    // ログインページにリダイレクト
    useEffect(() => {
      console.log('メインページ: 認証されていないため、ログインページにリダイレクト')
      window.location.href = '/login'
    }, [])
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
