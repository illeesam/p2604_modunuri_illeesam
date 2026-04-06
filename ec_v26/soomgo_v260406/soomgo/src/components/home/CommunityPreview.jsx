import { Link } from 'react-router-dom'
import { MessageCircle, Eye, ChevronRight } from 'lucide-react'

const posts = [
  { id: 1, category: '이사', title: '원룸 이사 비용 얼마나 드나요? 포장 이사 vs 반포장 이사 비교해드립니다', views: 3241, comments: 28, time: '2시간 전' },
  { id: 2, category: '청소', title: '에어컨 청소 직접 하면 위험할까요? 전문가 의견 모음', views: 2815, comments: 19, time: '4시간 전' },
  { id: 3, category: '과외', title: '중3 수학 과외 선생님 구하는 기준, 이렇게 확인하세요!', views: 1987, comments: 34, time: '6시간 전' },
]

export default function CommunityPreview() {
  return (
    <section className="py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-black text-gray-900">커뮤니티 인기글</h2>
        <Link to="/community" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
          더보기 <ChevronRight size={14} />
        </Link>
      </div>
      <div className="bg-white rounded-2xl divide-y divide-gray-100">
        {posts.map(post => (
          <Link key={post.id} to="/community" className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
            <span className="text-xs bg-primary-light text-primary font-medium px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5">{post.category}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">{post.title}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Eye size={11} />{post.views.toLocaleString()}</span>
                <span className="flex items-center gap-1"><MessageCircle size={11} />{post.comments}</span>
                <span>{post.time}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
