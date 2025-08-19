'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterFacePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError('')
      setSuccess('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setError('ファイルを選択してください')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/faces/register', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess(`顔写真登録成功！FaceID: ${result.faceId}`)
        // 登録完了後、すぐにギャラリーページに移動
        setTimeout(() => {
          router.push('/gallery/venue_01')
        }, 1500)
      } else {
        setError(result.error || '顔写真登録に失敗しました')
      }
    } catch (error) {
      console.error('登録エラー:', error)
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="register-container">
      <h1>顔写真登録</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="form-label">
            顔写真を選択してください（JPEG、PNG）:
          </label>
          <div className="file-row">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileChange}
              disabled={isLoading}
              className="file-input-hidden"
            />
            <button
              type="button"
              className="file-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              ファイルを選択
            </button>
            <span className="file-name">{selectedFile ? selectedFile.name : '選択されていません'}</span>
          </div>
        </div>

        {selectedFile && (
          <div style={{ marginBottom: '20px' }}>
            <p>選択されたファイル: {selectedFile.name}</p>
            <p>サイズ: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedFile || isLoading}
          className="submit-btn"
          style={{ backgroundColor: isLoading ? '#ccc' : '#007bff' }}
        >
          {isLoading ? '登録中...' : '顔写真を登録'}
        </button>
      </form>

      {error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '4px' 
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          borderRadius: '4px' 
        }}>
          {success}
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <p><strong>注意:</strong></p>
        <ul>
          <li>顔がはっきり写っている写真を選択してください</li>
          <li>ファイルサイズは5MB以下にしてください</li>
          <li>JPEG、PNG形式のみ対応しています</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => router.push('/gallery/venue_01')}
          className="back-btn"
        >
          会場ページに戻る
        </button>
      </div>

      <style jsx>{`
        .register-container {
          padding: 20px;
          max-width: 640px;
          margin: 0 auto;
        }
        h1 {
          font-size: 22px;
          margin-bottom: 16px;
        }
        .form-row { margin-bottom: 16px; }
        .file-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .file-input-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
        .file-button { padding: 10px 16px; border-radius: 6px; border: none; background:#e9ecef; color:#333; }
        .file-name { color:#666; font-size: 14px; }
        .submit-btn { width: 100%; padding: 12px 16px; border-radius: 8px; border: none; color: #fff; background:#007bff; }
        .submit-btn:disabled { background:#ccc; }
        .back-btn { width: 100%; padding: 12px 16px; border-radius: 8px; border: none; color: #fff; background:#6c757d; }

        @media (min-width: 769px) {
          .register-container { max-width: 720px; }
          h1 { font-size: 24px; }
          .file-row { flex-wrap: nowrap; }
          .submit-btn, .back-btn { width: auto; }
        }
      `}</style>
    </div>
  )
} 