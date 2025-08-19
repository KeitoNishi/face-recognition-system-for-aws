import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { faceId, registeredAt, confidence } = await request.json()
    
    if (!faceId) {
      return NextResponse.json(
        { error: 'FaceIDが指定されていません' },
        { status: 400 }
      )
    }

    // セッションに顔情報を保存
    const response = NextResponse.json({ 
      success: true, 
      message: '顔情報が保存されました'
    })
    
    // セッションクッキーに顔情報を保存
    const faceInfo = {
      faceId,
      registeredAt: registeredAt || new Date().toISOString(),
      confidence: confidence || 0
    }
    
    response.cookies.set('face_info', JSON.stringify(faceInfo), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24時間
    })
    
    return response
    
  } catch (error) {
    console.error('顔情報保存エラー:', error)
    return NextResponse.json(
      { error: '顔情報の保存に失敗しました' },
      { status: 500 }
    )
  }
} 