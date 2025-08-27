'use client'

import Link from 'next/link'

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
      </div>
      <style jsx>{`
        .header {
          background-color: rgb(0, 0, 0);
          height: 50px;
          width: 100%;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1000;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 20px;
        }
        
        .header-logo {
          text-align: center;
        }
        
        .logo-link {
          color: #f8f9fa;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: color 0.3s ease;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .logo-link:hover {
          color: #4dabf7;
        }
        
        @media (max-width: 768px) {
          .header-content {
            padding: 0 15px;
          }
          
          .header-logo .logo-link {
            font-size: 14px;
          }
        }
      `}</style>
    </header>
  )
} 