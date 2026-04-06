import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Eye, ThumbsUp, Search, PenSquare } from 'lucide-react'
import { categories } from '../data/categories'

const posts = [
  { id: 1, cat: '이사', title: '원룸 이사 셀프 vs 전문업체, 뭐가 나을까요?', content: '이번에 원룸 이사를 하려는데 짐이 많지 않아서 셀프로 할지 업체를 쓸지 고민이에요. 비용 차이가 얼마나 날까요?', author: '이사고민중', views: 3241, likes: 87, comments: 28, time: '2시간 전', solved: true },
  { id: 2, cat: '청소', title: '에어컨 청소 직접 하면 위험할까요? 전문가 의견 구합니다', content: '여름 전에 에어컨 청소를 하려는데, 유튜브 보니까 직접 할 수 있을 것 같더라고요. 근데 안전한지 궁금해요.', author: '청소초보', views: 2815, likes: 63, comments: 19, time: '4시간 전', solved: false },
  { id: 3, cat: '과외', title: '중3 수학 과외 선생님 구하는 기준 알려주세요', content: '아이가 중3인데 수학이 많이 약해서 과외를 알아보고 있어요. 어떤 기준으로 선생님을 고르는 게 좋을까요?', author: '학부모김씨', views: 1987, likes: 45, comments: 34, time: '6시간 전', solved: true },
  { id: 4, cat: '인테리어', title: '도배 셀프로 해본 분 계세요? 난이도가 어느 정도인가요?', content: '방 한 칸 정도 도배를 셀프로 해보려는데, 초보도 할 수 있을지 경험자 분들 의견 부탁드립니다.', author: '인테리어초보', views: 1654, likes: 32, comments: 22, time: '어제', solved: false },
  { id: 5, cat: '웨딩', title: '웨딩 스냅 vs 영상, 뭘 선택하셨나요?', content: '결혼식 촬영을 스냅만 할지 영상도 같이 할지 고민이에요. 결혼하신 분들 어떻게 하셨는지 궁금해요!', author: '예비신부', views: 2103, likes: 91, comments: 47, time: '어제', solved: false },
  { id: 6, cat: '반려동물', title: '강아지 짖음 교정, 훈련사한테 맡기는 게 효과 있나요?', content: '저희 강아지가 손님이 오면 너무 심하게 짖어서 이웃한테도 미안하고요. 전문 훈련사한테 맡겨보신 분 후기 부탁드려요.', author: '멍멍이집사', views: 1432, likes: 56, comments: 38, time: '2일 전', solved: true },
]

const cats = ['전체', ...categories.map(c => c.name)]

export default function Community() {
  const [activeCat, setActiveCat] = useState('전체')
  const [search, setSearch] = useState('')

  const filtered = posts.filter(p =>
    (activeCat === '전체' || p.cat === activeCat) &&
    (p.title.includes(search) || p.content.includes(search))
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">커뮤니티</h1>
        <button className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-primary-dark transition-colors">
          <PenSquare size={15} /> 글쓰기
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="궁금한 것을 검색해보세요"
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {cats.map(c => (
          <button key={c} onClick={() => setActiveCat(c)}
            className={`flex-shrink-0 text-sm px-4 py-1.5 rounded-full border transition-colors ${activeCat === c ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(post => (
          <div key={post.id} className="bg-white rounded-2xl p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-primary-light text-primary font-medium px-2 py-0.5 rounded-full">{post.cat}</span>
                  {post.solved && <span className="text-xs bg-green-100 text-green-600 font-medium px-2 py-0.5 rounded-full">해결완료</span>}
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5 leading-snug">{post.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{post.content}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span>{post.author}</span>
                  <span>{post.time}</span>
                  <span className="flex items-center gap-1"><Eye size={11} />{post.views.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><ThumbsUp size={11} />{post.likes}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={11} />{post.comments}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <MessageCircle size={40} className="mx-auto mb-4 opacity-30" />
            <p>검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}
