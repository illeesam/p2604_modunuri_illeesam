import { Link } from 'react-router-dom'
import { categories } from '../../data/categories'

export default function PresetServices() {
  return (
    <section className="py-10">
      <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-6">지금 필요한 서비스, <span className="text-primary">한번에 견적 받기</span></h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map(cat => (
          <Link key={cat.id} to={`/category/${cat.id}`}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="h-32 overflow-hidden">
              <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="p-3">
              <div className="text-xs text-gray-500 mb-1">{cat.preset}</div>
              <div className="font-bold text-sm text-gray-900">{cat.name}</div>
              <div className="text-xs text-primary mt-1">{cat.services.length}가지 서비스 →</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
