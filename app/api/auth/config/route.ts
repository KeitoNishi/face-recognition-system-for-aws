import { NextResponse } from 'next/server'
import { loadConfigFromParameterStore } from '@/lib/parameter-store'

export async function GET() {
  try {
    // Parameter Storeから設定を直接取得
    const config = await loadConfigFromParameterStore()
    
    const loginConfig = {
      password: config.login_password,
      redirectUrl: config.login_redirect_url
    }
    
    // 設定読み込み完了
    return NextResponse.json(loginConfig)
    
  } catch (error) {
    console.error('ログイン設定の取得エラー:', error)
    
    // エラー時は500エラーを返す
    return NextResponse.json(
      { error: '設定の取得に失敗しました' },
      { status: 500 }
    )
  }
} 