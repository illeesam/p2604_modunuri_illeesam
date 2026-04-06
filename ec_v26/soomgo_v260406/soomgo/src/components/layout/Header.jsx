import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Menu, X, ChevronDown, Bell, User } from 'lucide-react'
import { categories } from '../../data/categories'

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <div className="text-2xl font-black text-primary tracking-tight">숨고</div>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:flex items-center border-2 border-primary rounded-full overflow-hidden">
          <button type="button" onClick={() => setCatOpen(!catOpen)} className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 border-r border-gray-200 whitespace-nowrap hover:bg-gray-50">
            전체 서비스 <ChevronDown size={14} />
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="어떤 서비스가 필요하세요?"
            className="flex-1 px-4 py-2 text-sm outline-none"
          />
          <button type="submit" className="bg-primary text-white px-5 py-2 hover:bg-primary-dark transition-colors">
            <Search size={18} />
          </button>
        </form>

        {/* Nav buttons */}
        <div className="ml-auto flex items-center gap-2">
          <Link to="/request" className="hidden md:block text-sm font-medium text-gray-700 hover:text-primary px-3 py-2">견적 요청</Link>
          <Link to="/community" className="hidden md:block text-sm font-medium text-gray-700 hover:text-primary px-3 py-2">커뮤니티</Link>
          <Link to="/market" className="hidden md:block text-sm font-medium text-gray-700 hover:text-primary px-3 py-2">마켓</Link>
          <Link to="/login" className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-primary px-3 py-2 border border-gray-200 rounded-full">
            <User size={15} /> 로그인
          </Link>
          <Link to="/request" className="hidden md:block bg-primary text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-primary-dark transition-colors">
            고수 등록하기
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Category nav */}
      <div className="hidden md:block border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto py-2 scrollbar-hide">
          {categories.map(cat => (
            <Link key={cat.id} to={`/category/${cat.id}`} className="flex-shrink-0 flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary py-1 whitespace-nowrap">
              <span>{cat.icon}</span> {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4">
          <form onSubmit={handleSearch} className="flex border border-gray-300 rounded-full overflow-hidden mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="어떤 서비스가 필요하세요?"
              className="flex-1 px-4 py-2 text-sm outline-none"
            />
            <button type="submit" className="bg-primary text-white px-4 py-2"><Search size={16} /></button>
          </form>
          <div className="grid grid-cols-3 gap-2">
            {categories.map(cat => (
              <Link key={cat.id} to={`/category/${cat.id}`} onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-primary-light text-xs text-gray-700">
                <span className="text-2xl">{cat.icon}</span>
                {cat.name}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm border border-primary text-primary py-2 rounded-full font-medium">로그인</Link>
            <Link to="/signup" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm bg-primary text-white py-2 rounded-full font-medium">회원가입</Link>
          </div>
        </div>
      )}
    </header>
  )
}
