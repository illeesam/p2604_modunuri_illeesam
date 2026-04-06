import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { pros } from '../data/pros'
import { reviews } from '../data/reviews'
import StarRating from '../components/common/StarRating'
import ReviewCard from '../components/pro/ReviewCard'
import { MapPin, Clock, Shield, ChevronLeft, MessageCircle, Phone, Heart } from 'lucide-react'

export default function ProDetail() {
  const { id } = useParams()
  const pro = pros.find(p => p.id === Number(id))
  const proReviews = reviews.filter(r => r.proId === Number(id))
  const [liked, setLiked] = useState(false)
  const [tab, setTab] = useState('intro')

  if (!pro) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-gray-500">고수 정보를 찾을 수 없습니다.</p>
      <Link to="/" className="text-primary font-medium mt-4 inline-block">홈으로 →</Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to={`/category/${pro.category}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6">
        <ChevronLeft size={16} /> 목록으로
      </Link>

      {/* Profile header */}
      <div className="bg-white rounded-2xl p-6 mb-4">
        <div className="flex items-start gap-5">
          <img src={pro.img} alt={pro.name} className="w-24 h-24 rounded-full object-cover flex-shrink-0 ring-2 ring-primary-light" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-black text-gray-900">{pro.name}</h1>
                <p className="text-gray-600 mt-0.5">{pro.service} · {pro.career}</p>
              </div>
              <button onClick={() => setLiked(!liked)} className={`p-2 rounded-full border transition-all ${liked ? 'text-red-500 border-red-200 bg-red-50' : 'text-gray-400 border-gray-200'}`}>
                <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <StarRating rating={pro.rating} size="lg" />
              <span className="text-sm text-gray-500">리뷰 {pro.reviewCount}개</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {pro.tags.map(tag => (
                <span key={tag} className="bg-primary-light text-primary text-xs px-3 py-1 rounded-full font-medium">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100">
          <div className="text-center">
            <div className="text-primary font-black text-lg">{pro.rating}</div>
            <div className="text-xs text-gray-500 mt-0.5">평점</div>
          </div>
          <div className="text-center border-x border-gray-100">
            <div className="text-primary font-black text-lg">{pro.responseRate}%</div>
            <div className="text-xs text-gray-500 mt-0.5">응답률</div>
          </div>
          <div className="text-center">
            <div className="text-primary font-black text-lg">{pro.reviewCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">리뷰 수</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
          <MapPin size={14} className="text-primary" /> {pro.location} 활동
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl p-1">
        {[{key:'intro',label:'소개'},{key:'portfolio',label:'포트폴리오'},{key:'services',label:'서비스/가격'},{key:'reviews',label:`리뷰(${proReviews.length})`}].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === t.key ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl p-6 mb-4">
        {tab === 'intro' && (
          <div>
            <h3 className="font-bold text-gray-900 mb-3">자기 소개</h3>
            <p className="text-gray-700 leading-relaxed">{pro.bio}</p>
            <h3 className="font-bold text-gray-900 mt-6 mb-3">보유 자격증 및 경력</h3>
            <div className="flex flex-wrap gap-2">
              {pro.certifications.map(cert => (
                <span key={cert} className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                  <Shield size={13} className="text-primary" /> {cert}
                </span>
              ))}
            </div>
          </div>
        )}
        {tab === 'portfolio' && (
          <div>
            <h3 className="font-bold text-gray-900 mb-4">포트폴리오</h3>
            {pro.portfolio.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {pro.portfolio.map((img, i) => (
                  <img key={i} src={img} alt={`포트폴리오 ${i+1}`} className="w-full h-48 object-cover rounded-xl" />
                ))}
              </div>
            ) : <p className="text-gray-400 text-center py-10">등록된 포트폴리오가 없습니다.</p>}
          </div>
        )}
        {tab === 'services' && (
          <div>
            <h3 className="font-bold text-gray-900 mb-4">제공 서비스 및 가격</h3>
            <div className="space-y-3">
              {pro.services.map((svc, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-primary transition-colors">
                  <span className="text-sm font-medium text-gray-800">{svc.name}</span>
                  <span className="text-primary font-bold">{svc.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'reviews' && (
          <div>
            <div className="flex items-center gap-6 mb-6 pb-5 border-b border-gray-100">
              <div className="text-center">
                <div className="text-5xl font-black text-gray-900">{pro.rating}</div>
                <StarRating rating={pro.rating} size="lg" showNum={false} />
                <div className="text-xs text-gray-500 mt-1">{pro.reviewCount}개 리뷰</div>
              </div>
            </div>
            {proReviews.length > 0
              ? proReviews.map(r => <ReviewCard key={r.id} review={r} />)
              : <p className="text-gray-400 text-center py-10">아직 리뷰가 없습니다.</p>
            }
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="sticky bottom-4 bg-white rounded-2xl shadow-xl p-4 flex gap-3 border border-gray-100">
        <div className="flex-1">
          <div className="text-xs text-gray-500">예상 비용</div>
          <div className="font-black text-gray-900">{pro.avgPrice}</div>
        </div>
        <Link to="/request" className="flex-1 bg-primary text-white rounded-xl py-3 text-sm font-bold text-center hover:bg-primary-dark transition-colors">
          견적 요청하기
        </Link>
        <button className="w-12 h-12 border border-gray-200 rounded-xl flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
          <MessageCircle size={18} />
        </button>
      </div>
    </div>
  )
}
