import { VenueInfo } from '../types'

export const VENUE_LIST: VenueInfo[] = [
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

export function getVenueById(id: string): VenueInfo | undefined {
  return VENUE_LIST.find(venue => venue.id === id)
}

export function getVenueByPath(path: string): VenueInfo | undefined {
  return VENUE_LIST.find(venue => venue.path === path)
} 