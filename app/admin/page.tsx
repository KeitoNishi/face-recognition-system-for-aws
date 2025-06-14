"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Venue {
  id: number;
  name: string;
  createdAt: string;
}

export default function AdminPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [newVenueName, setNewVenueName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // 管理者認証チェック
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    
    if (!token || role !== 'admin') {
      router.push('/');
      return;
    }
    
    fetchVenues();
  }, [router]);

  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/venues');
      const data = await response.json();

      if (data.success) {
        setVenues(data.venues);
      } else {
        setError('会場の取得に失敗しました');
      }
    } catch (err) {
      setError('データの取得中にエラーが発生しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenueName.trim()) return;

    setCreating(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/venues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newVenueName.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setVenues([data.venue, ...venues]);
        setNewVenueName('');
      } else {
        setError(data.message || '会場の作成に失敗しました');
      }
    } catch (err) {
      setError('会場の作成中にエラーが発生しました');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const uploadPhotos = async () => {
    if (!selectedVenue || !selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('venueId', selectedVenue.toString());
      
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i]);
      }

      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        alert(`${data.photos.length}枚の写真をアップロードしました`);
        setSelectedFiles(null);
        setSelectedVenue(null);
        // ファイル入力をリセット
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setError(data.message || '写真のアップロードに失敗しました');
      }
    } catch (err) {
      setError('写真のアップロード中にエラーが発生しました');
      console.error(err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">管理画面を読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="page-header">
        <h1>管理者画面</h1>
        <div className="header-actions">
          <Link href="/" className="btn btn-secondary">
            ← ホームに戻る
          </Link>
          <Link href="/venues" className="btn btn-primary">
            会場一覧を見る
          </Link>
        </div>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <main className="admin-content">
        {/* 会場作成セクション */}
        <section className="admin-section">
          <h2>会場管理</h2>
          <form onSubmit={createVenue} className="venue-form">
            <div className="form-group">
              <label htmlFor="venueName" className="label">
                新しい会場名
              </label>
              <input
                id="venueName"
                type="text"
                value={newVenueName}
                onChange={(e) => setNewVenueName(e.target.value)}
                className="input"
                placeholder="会場名を入力"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating || !newVenueName.trim()}
            >
              {creating ? '作成中...' : '会場を作成'}
            </button>
          </form>

          <div className="venues-list">
            <h3>既存の会場 ({venues.length}件)</h3>
            {venues.length === 0 ? (
              <p>まだ会場がありません</p>
            ) : (
              <div className="venues-grid">
                {venues.map((venue) => (
                  <div key={venue.id} className="venue-card">
                    <h4>{venue.name}</h4>
                    <p className="venue-date">
                      作成日: {new Date(venue.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                    <div className="venue-actions">
                      <Link
                        href={`/venues/${venue.id}/photos`}
                        className="btn btn-sm btn-secondary"
                      >
                        写真を見る
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 写真アップロードセクション */}
        <section className="admin-section">
          <h2>写真アップロード</h2>
          
          <div className="upload-form">
            <div className="form-group">
              <label htmlFor="venueSelect" className="label">
                アップロード先の会場を選択
              </label>
              <select
                id="venueSelect"
                value={selectedVenue || ''}
                onChange={(e) => setSelectedVenue(e.target.value ? parseInt(e.target.value) : null)}
                className="input"
              >
                <option value="">会場を選択してください</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="fileInput" className="label">
                写真ファイルを選択
              </label>
              <input
                id="fileInput"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="file-input"
              />
              {selectedFiles && (
                <p className="file-info">
                  {selectedFiles.length}枚の写真が選択されています
                </p>
              )}
            </div>

            <button
              onClick={uploadPhotos}
              className="btn btn-primary"
              disabled={!selectedVenue || !selectedFiles || selectedFiles.length === 0 || uploading}
            >
              {uploading ? 'アップロード中...' : '写真をアップロード'}
            </button>

            {uploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p>アップロード中... {uploadProgress}%</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
