"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);

  useEffect(() => {
    // ローカルストレージからトークンをチェック
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole') as 'user' | 'admin' | null;
    
    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>顔認識写真管理システム</h1>
        {isAuthenticated && (
          <button onClick={handleLogout} className="btn btn-secondary">
            ログアウト
          </button>
        )}
      </header>

      <main className="main">
        {!isAuthenticated ? (
          <div className="login-section">
            <h2>ログイン</h2>
            <div className="login-options">
              <Link href="/login/user" className="btn btn-primary">
                一般ユーザーログイン
              </Link>
              <Link href="/login/admin" className="btn btn-secondary">
                管理者ログイン
              </Link>
            </div>
          </div>
        ) : (
          <div className="dashboard">
            <h2>
              {userRole === 'admin' ? '管理者ダッシュボード' : 'ユーザーダッシュボード'}
            </h2>
            
            <div className="navigation">
              <Link href="/venues" className="btn btn-primary">
                会場一覧
              </Link>
              
              {userRole === 'admin' && (
                <Link href="/admin" className="btn btn-primary">
                  管理画面
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="system-info">
          <h3>システム概要</h3>
          <ul>
            <li>イベント・会場ごとの写真管理</li>
            <li>顔認識による写真絞り込み（実装予定）</li>
            <li>写真のダウンロード機能</li>
            <li>管理者による写真アップロード</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
