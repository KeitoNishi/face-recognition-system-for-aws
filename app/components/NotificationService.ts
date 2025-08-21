import Swal from 'sweetalert2'

export class NotificationService {
  // 成功通知
  static success(message: string, title: string = '成功') {
    return Swal.fire({
      title,
      text: message,
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#28a745',
      timer: 3000,
      timerProgressBar: true,
    })
  }

  // エラー通知
  static error(message: string, title: string = 'エラー') {
    return Swal.fire({
      title,
      text: message,
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#dc3545',
    })
  }

  // 警告通知
  static warning(message: string, title: string = '警告') {
    return Swal.fire({
      title,
      text: message,
      icon: 'warning',
      confirmButtonText: 'OK',
      confirmButtonColor: '#ffc107',
    })
  }

  // 情報通知
  static info(message: string, title: string = '情報') {
    return Swal.fire({
      title,
      text: message,
      icon: 'info',
      confirmButtonText: 'OK',
      confirmButtonColor: '#17a2b8',
      timer: 4000,
      timerProgressBar: true,
    })
  }

  // 確認ダイアログ
  static confirm(message: string, title: string = '確認') {
    return Swal.fire({
      title,
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
    })
  }

  // 写真検索結果通知（成功）
  static photoSearchSuccess(count: number, type: 'ultra-fast' | 'efficient' = 'ultra-fast') {
    const typeText = type === 'ultra-fast' ? '事前インデックス化' : 'リアルタイム検索'
    return this.success(
      `${count}枚の写真が見つかりました！（${typeText}）`,
      '写真検索完了'
    )
  }

  // 写真検索結果通知（該当なし）
  static photoSearchNoResults() {
    return this.info(
      '該当する写真が見つかりませんでした。',
      '検索結果'
    )
  }

  // 顔写真未登録エラー
  static noFaceRegistered() {
    return this.warning(
      '顔写真が登録されていません。まず顔写真を登録してください。',
      '顔写真未登録'
    )
  }

  // ネットワークエラー
  static networkError() {
    return this.error(
      'ネットワークエラーが発生しました。再度お試しください。',
      'ネットワークエラー'
    )
  }

  // 写真検索失敗
  static photoSearchFailed() {
    return this.error(
      '写真の検索に失敗しました。',
      '検索エラー'
    )
  }

  // 顔認識フィルター失敗
  static faceFilterFailed(error?: string) {
    return this.error(
      error || '顔認識フィルターに失敗しました',
      'フィルターエラー'
    )
  }
} 