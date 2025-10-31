import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ 
      success: true, 
      message: 'ログアウトしました'
    })
    
    // プロトコルを判定してsecureフラグを設定
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const isSecure = protocol === 'https'
    
    // セッションクッキーを削除
    response.cookies.set('session_id', '', {
      httpOnly: true,
      secure: isSecure, // HTTPS環境ではtrue、HTTP環境ではfalse
      sameSite: 'lax',
      maxAge: 0 // 即座に削除
    })
    
    // 顔情報クッキーも削除（プライバシー保護）
    response.cookies.set('face_info', '', {
      httpOnly: true,
      secure: isSecure, // HTTPS環境ではtrue、HTTP環境ではfalse
      sameSite: 'lax',
      maxAge: 0 // 即座に削除
    })
    
    return response
    
  } catch (error) {
    console.error('ログアウトエラー:', error)
    return NextResponse.json(
      { error: 'ログアウトに失敗しました' },
      { status: 500 }
    )
  }
} 