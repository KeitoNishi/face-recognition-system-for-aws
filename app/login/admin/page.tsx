'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username,
          password, 
          type: 'admin' 
        }),
      });

      const data = await response.json();

      if (data.success) {
        // ローカルストレージにトークンを保存
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userRole', 'admin');
        
        // ホームページにリダイレクト
        router.push('/');
      } else {
        setError(data.message || 'ログインに失敗しました');
      }
    } catch (err) {
      setError('ログイン処理中にエラーが発生しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="login-container">
        <header className="login-header">
          <h1>管理者ログイン</h1>
          <p>管理者IDとパスワードを入力してください</p>
        </header>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username" className="label">
              管理者ID
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              placeholder="管理者IDを入力"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="label">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="パスワードを入力"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="login-footer">
          <Link href="/" className="link">
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
} 