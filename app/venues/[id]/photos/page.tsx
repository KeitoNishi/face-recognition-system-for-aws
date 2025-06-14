'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Photo {
  id: number;
  venueId: number;
  filename: string;
  url: string | null;
  uploadedAt: string;
}

interface Venue {
  id: number;
  name: string;
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const router = useRouter();
  const params = useParams();
  const venueId = params.id as string;

  useEffect(() => {
    // 認証チェック
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/');
      return;
    }
    
    fetchPhotos();
  }, [router, venueId]);

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/photos?venueId=${venueId}`);
      const data = await response.json();

      if (data.success) {
        setPhotos(data.photos);
      } else {
        setError('写真の取得に失敗しました');
      }
    } catch (err) {
      setError('データの取得中にエラーが発生しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPhoto = async (photo: Photo) => {
    if (!photo.url) return;
    
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('ダウンロードに失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">写真を読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="page-header">
        <h1>会場の写真</h1>
        <div className="header-actions">
          <Link href="/venues" className="btn btn-secondary">
            ← 会場一覧に戻る
          </Link>
        </div>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <main className="photos-content">
        {photos.length === 0 ? (
          <div className="empty-state">
            <h3>写真がありません</h3>
            <p>この会場にはまだ写真がアップロードされていません。</p>
          </div>
        ) : (
          <>
            <div className="photos-header">
              <p>{photos.length}枚の写真があります</p>
              <div className="photo-note">
                <small>※ 顔認識機能は実装予定です</small>
              </div>
            </div>
            
            <div className="photos-grid">
              {photos.map((photo) => (
                <div key={photo.id} className="photo-card">
                  {photo.url ? (
                    <img
                      src={photo.url}
                      alt={photo.filename}
                      className="photo-image"
                      onClick={() => setSelectedPhoto(photo)}
                    />
                  ) : (
                    <div className="photo-placeholder">
                      画像を読み込めません
                    </div>
                  )}
                  <div className="photo-info">
                    <p className="photo-filename">{photo.filename}</p>
                    <button
                      onClick={() => downloadPhoto(photo)}
                      className="btn-download"
                      disabled={!photo.url}
                    >
                      ダウンロード
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* モーダル */}
      {selectedPhoto && (
        <div className="modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedPhoto.filename}</h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {selectedPhoto.url && (
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.filename}
                  className="modal-image"
                />
              )}
            </div>
            <div className="modal-footer">
              <button
                onClick={() => downloadPhoto(selectedPhoto)}
                className="btn btn-primary"
                disabled={!selectedPhoto.url}
              >
                ダウンロード
              </button>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="btn btn-secondary"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 