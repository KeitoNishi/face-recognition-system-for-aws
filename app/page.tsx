'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Venue {
  id: string
  name: string
  location: string
  path: string
}

export default function Home() {
  const [venues, setVenues] = useState<Venue[]>([])
  const router = useRouter()

  // 会場一覧データ
  const venueList: Venue[] = [
    { id: 'venue_01', name: '第1会場', location: '（4F ホールC）', path: '/gallery/venue_01' },
    { id: 'venue_02', name: '第2会場', location: '（7F ホールB7（1））', path: '/gallery/venue_02' },
    { id: 'venue_03', name: '第3会場', location: '（7F ホールB7（2）', path: '/gallery/venue_03' },
    { id: 'venue_04', name: '第4会場', location: '（5F ホールB5（1））', path: '/gallery/venue_04' },
    { id: 'venue_05', name: '第5会場', location: '（5F ホールB5（2）', path: '/gallery/venue_05' },
    { id: 'venue_06', name: '第6会場', location: '（7F ホールD7）', path: '/gallery/venue_06' },
    { id: 'venue_07', name: '第7会場', location: '（5F ホールD5）', path: '/gallery/venue_07' },
    { id: 'venue_08', name: '第8会場', location: '（1F ホールD1）', path: '/gallery/venue_08' },
    { id: 'venue_09', name: '第9会場', location: '（7F G701）', path: '/gallery/venue_09' },
    { id: 'venue_10', name: '第10会場', location: '（4F G409）', path: '/gallery/venue_10' },
    { id: 'venue_11', name: '学術展示会場', location: '（B2F ホールE）', path: '/gallery/venue_11' },
    { id: 'venue_12', name: '会長招宴', location: '', path: '/gallery/venue_12' },
    { id: 'venue_13', name: '器械展示会場・おもてなしコーナー・休憩スペース', location: '', path: '/gallery/venue_13' },
    { id: 'venue_14', name: '市民公開講座', location: '', path: '/gallery/venue_14' },
    { id: 'venue_15', name: '開会式・総会・閉会式', location: '', path: '/gallery/venue_15' },
  ]

  useEffect(() => {
    setVenues(venueList)
  }, [])

  const handleVenueClick = (venue: Venue) => {
    router.push(venue.path)
  }

  return (
    <div id="container">
      <section id="mv">
        <div>
          <h1><img src="/images/title.svg" alt="第129回日本眼科学会総会 フォトギャラリー"/></h1>
          <div>
            <p><img src="/images/date.svg" alt="会期：2025年4月17日（木）～4月20日（日）"/></p>
            <p><img src="/images/venue.svg" alt="会場：東京国際フォーラム"/></p>
          </div>
        </div>
      </section>
      
      <section id="upload">
        <dl>
          <dt>顔写真登録</dt>
          <dd>顔写真を登録すると、フォトギャラリー内の写真と登録された顔写真を照らし合わせ、一致した写真が絞り込んで表示されます。
          <p className="note">取り込まれた顔写真は、ユーザー情報とは一切紐付けられず、今回の写真照合のみに使用されます。照合完了後は速やかに破棄され、システム上に保存されることはありません。</p>
          </dd>
        </dl>
        <input className="upload_btn" type="button" value="顔写真を登録する" />
      </section>
      
      <section id="wrapper">
        <div id="venue">
          {venues.map((venue) => (
            <div key={venue.id}>
              <a href="#" onClick={(e) => { e.preventDefault(); handleVenueClick(venue); }}>
                <p>
                  {venue.name}
                  {venue.location && <span>{venue.location}</span>}
                </p>
              </a>
            </div>
          ))}
        </div>
      </section>
      
      <footer>
        <p>&copy; 2025- The 129th Annual Meeting of the Japanese Ophthalmological Society.</p>
      </footer>
      
      <p id="pagetop"><a href="#"></a></p>
    </div>
  )
}
