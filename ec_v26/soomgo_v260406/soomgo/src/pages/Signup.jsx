import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', type: 'client' })
  const [agreed, setAgreed] = useState(false)

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="text-4xl font-black text-primary mb-2">숨고</div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-black text-gray-900 mb-6">회원가입</h2>

        {/* Type selection */}
        <div className="flex gap-3 mb-6">
          {[{key:'client',label:'의뢰인으로 가입',desc:'서비스를 찾는 분'},{key:'pro',label:'고수로 가입',desc:'서비스를 제공하는 분'}].map(t => (
            <button key={t.key} onClick={() => setForm(f => ({ ...f, type: t.key }))}
              className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${form.type === t.key ? 'border-primary bg-primary-light' : 'border-gray-200'}`}>
              <div className="font-bold text-sm text-gray-900">{t.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>

        <div className="space-y-4 mb-6">
          {[
            { key: 'name', label: '이름', type: 'text', placeholder: '홍길동' },
            { key: 'email', label: '이메일', type: 'email', placeholder: 'example@email.com' },
            { key: 'password', label: '비밀번호', type: 'password', placeholder: '8자 이상 입력' },
            { key: 'phone', label: '휴대폰 번호', type: 'tel', placeholder: '010-0000-0000' },
          ].map(field => (
            <div key={field.key}>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">{field.label}</label>
              <input type={field.type} value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors" />
            </div>
          ))}
        </div>

        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <div onClick={() => setAgreed(!agreed)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${agreed ? 'bg-primary border-primary' : 'border-gray-300'}`}>
            {agreed && <Check size={12} className="text-white" />}
          </div>
          <span className="text-xs text-gray-600 leading-relaxed">
            <span className="text-primary font-medium cursor-pointer hover:underline">이용약관</span> 및{' '}
            <span className="text-primary font-medium cursor-pointer hover:underline">개인정보처리방침</span>에 동의합니다. (필수)
          </span>
        </label>

        <button disabled={!agreed || !form.name || !form.email || !form.password}
          className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-40">
          회원가입 완료
        </button>

        <div className="text-center mt-4 text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">로그인</Link>
        </div>
      </div>
    </div>
  )
}
