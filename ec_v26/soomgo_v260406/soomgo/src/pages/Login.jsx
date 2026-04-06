import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="text-4xl font-black text-primary mb-2">숨고</div>
        <p className="text-gray-500 text-sm">전문가를 찾는 가장 쉬운 방법</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-black text-gray-900 mb-6">로그인</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">이메일</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">비밀번호</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors pr-12" />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <button className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors mb-4">
          로그인
        </button>

        <div className="relative flex items-center justify-center mb-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <span className="relative bg-white px-3 text-xs text-gray-400">또는 소셜 로그인</span>
        </div>

        <div className="space-y-2.5">
          <button className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-yellow-300 text-gray-900 py-3 rounded-xl text-sm font-bold transition-colors">
            <span className="text-lg">💬</span> 카카오로 로그인
          </button>
          <button className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-xl text-sm font-bold transition-colors">
            <span className="text-lg">🔵</span> 구글로 로그인
          </button>
          <button className="w-full flex items-center justify-center gap-3 bg-[#03C75A] hover:bg-green-500 text-white py-3 rounded-xl text-sm font-bold transition-colors">
            <span className="text-lg">N</span> 네이버로 로그인
          </button>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          아직 계정이 없으신가요?{' '}
          <Link to="/signup" className="text-primary font-bold hover:underline">회원가입</Link>
        </div>
      </div>
    </div>
  )
}
