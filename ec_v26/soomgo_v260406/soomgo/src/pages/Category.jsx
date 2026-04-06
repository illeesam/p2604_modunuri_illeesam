import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { categories } from '../data/categories'
import { pros } from '../data/pros'
import ProCard from '../components/pro/ProCard'
import { SlidersHorizontal, ChevronDown } from 'lucide-react'

const regions = ['전체','강남구','서초구','송파구','마포구','용산구','성동구','강서구','종로구','여의도']
const sorts = ['추천순','리뷰 많은 순','별점 높은 순','가격 낮은 순']

export default function Category() {
  const { id } = useParams()
  const cat = categories.find(c => c.id === id)
  const [region, setRegion] = useState('전체')
  const [sort, setSort] = useState('추천순')
  const [minRating, setMinRating] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)

  const filtered = pros
    .filter(p => p.category === id)
    .concat(pros.filter(p => p.category !== id))
    .slice(0, 12)
    .filter(p => region === '전체' || p.location === region)
    .filter(p => p.rating >= minRating)
    .sort((a, b) => {
      if (sort === '별점 높은 순') return b.rating - a.rating
      if (sort === '리뷰 많은 순') return b.reviewCount - a.reviewCount
      return 0
    })

  if (!cat) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <p className="text-gray-500">카테고리를 찾을 수 없습니다.</p>
      <Link to="/" className="text-primary font-medium mt-4 inline-block">홈으로 →</Link>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Link to="/" className="hover:text-primary">홈</Link> <span>/</span>
          <span className="text-gray-900 font-medium">{cat.name}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">{cat.icon} {cat.name} 전문 고수</h1>
        <p className="text-gray-500 text-sm">총 {filtered.length}명의 고수가 있습니다</p>
      </div>

      {/* Services */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        <button className="flex-shrink-0 bg-primary text-white text-sm px-4 py-1.5 rounded-full font-medium">전체</button>
        {cat.services.map(svc => (
          <button key={svc} className="flex-shrink-0 border border-gray-200 text-gray-700 text-sm px-4 py-1.5 rounded-full hover:border-primary hover:text-primary transition-colors whitespace-nowrap">
            {svc}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters */}
        <aside className="md:w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl p-4 sticky top-20">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><SlidersHorizontal size={16} /> 필터</h3>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">지역</h4>
              <div className="flex flex-wrap gap-1.5">
                {regions.map(r => (
                  <button key={r} onClick={() => setRegion(r)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${region === r ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">최소 별점</h4>
              {[0, 4, 4.5, 4.8].map(r => (
                <label key={r} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input type="radio" name="rating" checked={minRating === r} onChange={() => setMinRating(r)} className="accent-primary" />
                  <span className="text-sm text-gray-700">{r === 0 ? '전체' : `${r}점 이상 ★`}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">{filtered.length}개 결과</span>
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-primary">
              {sorts.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(pro => <ProCard key={pro.id} pro={pro} />)}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-4">😢</p>
              <p>해당 조건에 맞는 고수가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
