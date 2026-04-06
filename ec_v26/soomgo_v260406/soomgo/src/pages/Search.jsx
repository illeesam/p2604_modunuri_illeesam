import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { pros } from '../data/pros'
import { categories } from '../data/categories'
import ProCard from '../components/pro/ProCard'
import { Search } from 'lucide-react'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const [query, setQuery] = useState(q)

  const results = pros.filter(p =>
    p.name.includes(q) || p.service.includes(q) || p.bio.includes(q) || p.tags.some(t => t.includes(q))
  )

  const catResults = categories.filter(c =>
    c.name.includes(q) || c.services.some(s => s.includes(q))
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 mb-2">'{q}' 검색 결과</h1>
        <p className="text-gray-500 text-sm">고수 {results.length}명 · 카테고리 {catResults.length}개</p>
      </div>

      {catResults.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">관련 카테고리</h2>
          <div className="flex gap-3 flex-wrap">
            {catResults.map(cat => (
              <Link key={cat.id} to={`/category/${cat.id}`}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 hover:border-primary hover:text-primary transition-colors text-sm">
                <span>{cat.icon}</span> {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-lg font-bold text-gray-900 mb-4">관련 고수</h2>
      {results.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map(pro => <ProCard key={pro.id} pro={pro} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <Search size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">'{q}'에 대한 검색 결과가 없습니다.</p>
          <p className="text-sm mt-2">다른 키워드로 검색해보세요.</p>
        </div>
      )}
    </div>
  )
}
