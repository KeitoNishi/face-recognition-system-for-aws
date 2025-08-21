'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFaceUpload } from './FaceUploadProvider'

interface MVSectionProps {
  onLogout: () => Promise<void>
  isLoggingOut?: boolean
}

export default function MVSection({ onLogout, isLoggingOut = false }: MVSectionProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const { openFaceUploadModal } = useFaceUpload()

  const handleMenuClick = (action: string) => {
    setIsMenuOpen(false)
    switch (action) {
      case 'home':
        router.push('/')
        break
      case 'register':
        openFaceUploadModal()
        break
      case 'logout':
        onLogout()
        break
    }
  }

  return (
    <section id="mv">
      {/* ナビゲーションバー */}
      <nav className="top-nav">
        <div className="nav-container">
          <div className="nav-menu">
            <button 
              className="nav-item" 
              onClick={() => handleMenuClick('home')}
            >
              ホーム
            </button>
            <button 
              className="nav-item" 
              onClick={() => handleMenuClick('register')}
            >
              顔写真登録
            </button>
            <button 
              className="nav-item logout-btn" 
              onClick={() => handleMenuClick('logout')}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
            </button>
          </div>
          
          {/* モバイル用ハンバーガーメニュー */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="メニュー"
          >
            <span className={`menu-line ${isMenuOpen ? 'open' : ''}`}></span>
            <span className={`menu-line ${isMenuOpen ? 'open' : ''}`}></span>
            <span className={`menu-line ${isMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
        
        {/* モバイルメニュー */}
        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <button 
            className="mobile-nav-item" 
            onClick={() => handleMenuClick('home')}
          >
            ホーム
          </button>
          <button 
            className="mobile-nav-item" 
            onClick={() => handleMenuClick('register')}
          >
            顔写真登録
          </button>
          <button 
            className="mobile-nav-item logout-btn" 
            onClick={() => handleMenuClick('logout')}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
          </button>
        </div>
      </nav>
      
      <div>
        <h1><img src="/images/title.svg" alt="第129回日本眼科学会総会 フォトギャラリー"/></h1>
        <div>
          <p><img src="/images/date.svg" alt="会期：2025年4月17日（木）～4月20日（日）"/></p>
          <p><img src="/images/venue.svg" alt="会場：東京国際フォーラム"/></p>
        </div>
      </div>

      <style jsx>{`
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
          padding-right: 35px;
          flex-wrap: nowrap;
        }
        
        .nav-item {
          background: none;
          border: none;
          padding: 6px 12px;
          font-size: 14px;
          color: #555;
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
          background: none;
          color: #555;
        }
        
        .nav-item.logout-btn:hover {
          background: rgba(0, 123, 255, 0.1);
          color: #007bff;
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
          text-align: center;
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
      `}</style>
    </section>
  )
} 