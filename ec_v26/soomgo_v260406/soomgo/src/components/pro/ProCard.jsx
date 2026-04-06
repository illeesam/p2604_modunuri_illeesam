import { Link } from 'react-router-dom'
import StarRating from '../common/StarRating'
import { MessageCircle, MapPin } from 'lucide-react'

export default function ProCard({ pro }) {
  return (
    <Link to={`/pro/${pro.id}`} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden block">
      <div className="relative">
        <img src={pro.img} alt={pro.name} className="w-full h-40 object-cover" />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-medium text-gray-700">
          {pro.service}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-gray-900">{pro.name}</span>
          <span className="text-xs text-gray-500">{pro.career}</span>
        </div>
        <StarRating rating={pro.rating} />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MessageCircle size={12} />
            <span>리뷰 {pro.reviewCount}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={12} />
            <span>{pro.location}</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {pro.tags.slice(0, 3).map(tag => (
            <span key={tag} className="bg-primary-light text-primary text-xs px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
        <div className="mt-3 text-sm font-bold text-gray-900">{pro.avgPrice}</div>
      </div>
    </Link>
  )
}
