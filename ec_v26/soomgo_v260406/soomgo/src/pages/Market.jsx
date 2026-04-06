import { useState } from 'react'
import { ShoppingCart, Star, Filter } from 'lucide-react'

const products = [
  { id: 1, name: '이사용 에어캡 롤 (1m x 50m)', price: 12900, rating: 4.7, reviews: 234, category: '이사', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80', badge: '베스트' },
  { id: 2, name: '청소 전문가용 극세사 걸레 10매', price: 18500, rating: 4.8, reviews: 187, category: '청소', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&q=80', badge: '신상품' },
  { id: 3, name: '도배 전문 풀 브러시 세트', price: 35000, rating: 4.6, reviews: 92, category: '인테리어', img: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=300&q=80', badge: null },
  { id: 4, name: '반려동물 훈련용 클리커 + 트릿 파우치', price: 22000, rating: 4.9, reviews: 315, category: '반려동물', img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&q=80', badge: '베스트' },
  { id: 5, name: '자동차 광택 코팅제 프리미엄', price: 45000, rating: 4.5, reviews: 128, category: '자동차', img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300&q=80', badge: null },
  { id: 6, name: '수학 과외용 화이트보드 A3', price: 28000, rating: 4.7, reviews: 76, category: '과외', img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&q=80', badge: '신상품' },
]

const cats = ['전체', '이사', '청소', '인테리어', '반려동물', '자동차', '과외']

export default function Market() {
  const [activeCat, setActiveCat] = useState('전체')
  const filtered = products.filter(p => activeCat === '전체' || p.category === activeCat)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 mb-2">마켓</h1>
        <p className="text-gray-500 text-sm">전문가 추천 서비스 용품을 합리적인 가격에</p>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-primary to-blue-400 rounded-2xl p-6 mb-8 flex items-center justify-between">
        <div className="text-white">
          <div className="text-xs font-medium opacity-80 mb-1">이달의 기획전</div>
          <h2 className="text-xl font-black">이사철 준비물 모음</h2>
          <p className="text-sm opacity-80 mt-1">최대 30% 할인 중</p>
        </div>
        <div className="text-5xl">📦</div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {cats.map(c => (
          <button key={c} onClick={() => setActiveCat(c)}
            className={`flex-shrink-0 text-sm px-4 py-1.5 rounded-full border transition-colors ${activeCat === c ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <div className="relative h-44 overflow-hidden">
              <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              {p.badge && (
                <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${p.badge === '베스트' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                  {p.badge}
                </span>
              )}
            </div>
            <div className="p-4">
              <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-2">{p.name}</p>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                <span>{p.rating}</span>
                <span>({p.reviews})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-black text-gray-900">{p.price.toLocaleString()}원</span>
                <button className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors">
                  <ShoppingCart size={14} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
