import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({ 
      success: true, 
      message: 'ログアウトしました'
    })
    
    // セッションクッキーを削除
    response.cookies.set('session_id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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