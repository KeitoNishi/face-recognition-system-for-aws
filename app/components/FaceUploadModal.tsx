'use client'

import { useState, useRef } from 'react'

interface FaceUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function FaceUploadModal({ isOpen, onClose, onSuccess }: FaceUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // ファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setError('対応していないファイル形式です（JPEG、PNGのみ対応）')
      return
    }

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズが大きすぎます（5MB以下にしてください）')
      return
    }

    setSelectedFile(file)
    setError(null)
    setSuccess(null)

    // プレビュー表示
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/faces/register', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(result.message)
        setTimeout(() => {
          onSuccess()
          handleClose()
        }, 2000)
      } else {
        setError(result.error || '顔写真の登録に失敗しました')
      }
    } catch (error) {
      console.error('アップロードエラー:', error)
      setError('ネットワークエラーが発生しました。再度お試しください。')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    setSuccess(null)
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      // ファイル形式チェック
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(file.type)) {
        setError('対応していないファイル形式です（JPEG、PNGのみ対応）')
        return
      }

      // ファイルサイズチェック（5MB以下）
      if (file.size > 5 * 1024 * 1024) {
        setError('ファイルサイズが大きすぎます（5MB以下にしてください）')
        return
      }

      setSelectedFile(file)
      setError(null)
      setSuccess(null)

      // プレビュー表示
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>顔写真登録</h3>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          <p className="description">
            顔がはっきり写っている写真をアップロードしてください。
            この写真は顔認識による写真絞り込みに使用されます。
          </p>

          <div className="upload-area" onDragOver={handleDragOver} onDrop={handleDrop}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            {!previewUrl ? (
              <div className="upload-placeholder" onClick={() => fileInputRef.current?.click()}>
                <div className="upload-icon">📷</div>
                <p>クリックまたはドラッグ&ドロップで写真を選択</p>
                <p className="upload-hint">JPEG、PNG形式、5MB以下</p>
              </div>
            ) : (
              <div className="preview-container">
                <img src={previewUrl} alt="プレビュー" className="preview-image" />
                <button 
                  className="change-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  写真を変更
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              <p>⚠️ {error}</p>
            </div>
          )}

          {success && (
            <div className="success-message">
              <p>✅ {success}</p>
            </div>
          )}

          <div className="modal-footer">
            <button 
              className="cancel-button" 
              onClick={handleClose}
              disabled={isUploading}
            >
              キャンセル
            </button>
            <button 
              className="upload-button" 
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? '登録中...' : '顔写真を登録'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h3 {
          margin: 0;
          color: #333;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          color: #333;
        }

        .modal-body {
          padding: 20px;
        }

        .description {
          margin-bottom: 20px;
          color: #666;
          line-height: 1.5;
        }

        .upload-area {
          border: 2px dashed #ddd;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin-bottom: 20px;
          transition: border-color 0.3s;
        }

        .upload-area:hover {
          border-color: #007bff;
        }

        .upload-placeholder {
          cursor: pointer;
          padding: 40px 20px;
        }

        .upload-icon {
          font-size: 48px;
          margin-bottom: 10px;
        }

        .upload-hint {
          font-size: 12px;
          color: #999;
          margin-top: 5px;
        }

        .preview-container {
          position: relative;
        }

        .preview-image {
          max-width: 100%;
          max-height: 300px;
          border-radius: 4px;
          margin-bottom: 10px;
        }

        .change-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .change-button:hover:not(:disabled) {
          background: #5a6268;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .success-message {
          background: #d4edda;
          color: #155724;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .cancel-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .cancel-button:hover:not(:disabled) {
          background: #5a6268;
        }

        .upload-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .upload-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .upload-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .cancel-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .modal-content { width: 100%; height: 100dvh; max-height: none; border-radius: 0; display: flex; flex-direction: column; }
          .modal-header { position: sticky; top: 0; background: #fff; z-index: 1; padding: 16px; }
          .modal-body { flex: 1; overflow-y: auto; padding: 16px; }
          .modal-footer { position: sticky; bottom: 0; background: #fff; border-top: 1px solid #eee; padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
          .cancel-button, .upload-button { width: 100%; }
          .upload-placeholder { padding: 24px 12px; }
          .preview-image { max-height: 40vh; }
        }
      `}</style>
    </div>
  )
} 