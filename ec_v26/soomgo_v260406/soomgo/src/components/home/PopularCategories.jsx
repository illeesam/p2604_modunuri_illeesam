import { Link } from 'react-router-dom'
import { popularCategories } from '../../data/categories'

export default function PopularCategories() {
  return (
    <section className="py-10 bg-white rounded-2xl px-6">
      <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-6">인기 서비스 카테고리</h2>
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-4">
        {popularCategories.map((cat, i) => (
          <Link key={i} to={`/category/${cat.id}`} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center text-2xl group-hover:bg-primary group-hover:text-white transition-all">
              {cat.icon}
            </div>
            <span className="text-xs text-gray-600 text-center leading-tight">{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
