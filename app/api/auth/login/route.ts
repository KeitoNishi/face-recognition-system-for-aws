import { NextRequest, NextResponse } from 'next/server'
import { loadConfigFromParameterStore } from '@/lib/parameter-store'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    if (!password) {
      return NextResponse.json(
        { error: 'パスワードが入力されていません' },
        { status: 400 }
      )
    }

    // Parameter Storeから設定を取得
    const config = await loadConfigFromParameterStore()
    
    // パスワードを検証
    if (password === config.login_password) {
      // セッションを作成（実際の実装ではJWTトークンなどを使用）
      const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      
      const response = NextResponse.json({ 
        success: true, 
        message: 'ログインに成功しました',
        redirectUrl: config.login_redirect_url || '/'
      })
      
      // セッションクッキーを設定（24時間有効）
      response.cookies.set('session_id', sessionId, {
        httpOnly: true,
        secure: false, // HTTP環境のためfalseに設定
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 // 24時間
      })
      
      return response
    } else {
      return NextResponse.json(
        { error: 'パスワードが正しくありません' },
        { status: 401 }
      )
    }
    
  } catch (error) {
    console.error('ログインエラー:', error)
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    )
  }
} 