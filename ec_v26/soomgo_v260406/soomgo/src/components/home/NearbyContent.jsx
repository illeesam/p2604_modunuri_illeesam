import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'

const nearbyItems = [
  {
    id: 1, title: '이사/입주 청소업체 고민 해결법', type: '포트폴리오',
    img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&q=80',
    rating: 4.9, reviews: 128, link: '/category/cleaning'
  },
  {
    id: 2, title: '강남구 주민들이 만족한 도배 고수', type: '포트폴리오',
    img: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=300&q=80',
    rating: 4.8, reviews: 95, link: '/category/interior'
  },
  {
    id: 3, title: '수능 수학 1등급 만드는 과외 선생님', type: '포트폴리오',
    img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&q=80',
    rating: 5.0, reviews: 76, link: '/category/tutoring'
  },
  {
    id: 4, title: '반려견 행동 교정 전문 트레이너', type: '커뮤니티',
    img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&q=80',
    rating: 4.9, reviews: 54, link: '/category/pet'
  },
]

export default function NearbyContent() {
  return (
    <section className="py-10">
      <div className="flex items-center gap-2 mb-6">
        <MapPin size={18} className="text-primary" />
        <h2 className="text-xl md:text-2xl font-black text-gray-900">최근 <span className="text-primary">강남구</span> 주변에서 많이 본</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {nearbyItems.map(item => (
          <Link key={item.id} to={item.link} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="h-36 overflow-hidden">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="p-3">
              <span className="text-xs text-primary bg-primary-light px-2 py-0.5 rounded-full">{item.type}</span>
              <p className="text-sm font-medium text-gray-800 mt-2 leading-snug line-clamp-2">{item.title}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                <span className="text-yellow-400">★</span>
                <span>{item.rating}</span>
                <span className="text-gray-300">·</span>
                <span>리뷰 {item.reviews}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
