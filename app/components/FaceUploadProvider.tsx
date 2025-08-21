'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import FaceUploadModal from './FaceUploadModal'

interface FaceUploadContextType {
  openFaceUploadModal: () => void
  closeFaceUploadModal: () => void
  isFaceUploadModalOpen: boolean
}

const FaceUploadContext = createContext<FaceUploadContextType | undefined>(undefined)

interface FaceUploadProviderProps {
  children: ReactNode
  onSuccess?: () => void
}

export function FaceUploadProvider({ children, onSuccess }: FaceUploadProviderProps) {
  const [isFaceUploadModalOpen, setIsFaceUploadModalOpen] = useState(false)

  const openFaceUploadModal = () => {
    setIsFaceUploadModalOpen(true)
  }

  const closeFaceUploadModal = () => {
    setIsFaceUploadModalOpen(false)
  }

  const handleSuccess = () => {
    closeFaceUploadModal()
    onSuccess?.()
  }

  return (
    <FaceUploadContext.Provider value={{
      openFaceUploadModal,
      closeFaceUploadModal,
      isFaceUploadModalOpen
    }}>
      {children}
      
      <FaceUploadModal
        isOpen={isFaceUploadModalOpen}
        onClose={closeFaceUploadModal}
        onSuccess={handleSuccess}
      />
    </FaceUploadContext.Provider>
  )
}

export function useFaceUpload() {
  const context = useContext(FaceUploadContext)
  if (context === undefined) {
    throw new Error('useFaceUpload must be used within a FaceUploadProvider')
  }
  return context
} 