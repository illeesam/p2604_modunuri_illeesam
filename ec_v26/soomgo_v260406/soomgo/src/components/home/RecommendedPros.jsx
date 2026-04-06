import { Link } from 'react-router-dom'
import { pros } from '../../data/pros'
import ProCard from '../pro/ProCard'

export default function RecommendedPros() {
  return (
    <section className="py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-black text-gray-900">오늘의 추천 고수</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">AD</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {pros.slice(0, 10).map(pro => (
          <ProCard key={pro.id} pro={pro} />
        ))}
      </div>
    </section>
  )
}
