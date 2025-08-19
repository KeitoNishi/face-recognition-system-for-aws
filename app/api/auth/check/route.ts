import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // セッションクッキーを取得
    const sessionId = request.cookies.get('session_id')
    const faceInfo = request.cookies.get('face_info')
    
    if (sessionId && sessionId.value) {
      // セッションが存在する場合（実際の実装ではデータベースで検証）
      const result: any = {
        authenticated: true,
        message: 'セッションが有効です'
      }
      
      // 顔情報があれば追加
      if (faceInfo) {
        try {
          result.faceInfo = JSON.parse(faceInfo.value)
        } catch (error) {
          console.error('顔情報の解析エラー:', error)
        }
      }
      
      return NextResponse.json(result)
    } else {
      // セッションが存在しない場合
      return NextResponse.json({ 
        authenticated: false,
        message: 'セッションが無効です'
      })
    }
    
  } catch (error) {
    console.error('セッション確認エラー:', error)
    return NextResponse.json(
      { authenticated: false, error: 'セッション確認に失敗しました' },
      { status: 500 }
    )
  }
} 