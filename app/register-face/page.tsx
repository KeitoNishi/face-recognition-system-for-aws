'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterFacePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

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
      formData.append('faceImage', selectedFile)

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
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>顔写真登録</h1>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label>
            顔写真を選択してください（JPEG、PNG）:
            <br />
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileChange}
              disabled={isLoading}
              style={{ marginTop: '10px' }}
            />
          </label>
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
          style={{
            padding: '10px 20px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
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
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          会場ページに戻る
        </button>
      </div>
    </div>
  )
} 