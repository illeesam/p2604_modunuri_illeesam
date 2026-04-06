import { useState } from 'react'
import { Link } from 'react-router-dom'
import { categories } from '../data/categories'
import { Check, ChevronRight } from 'lucide-react'

const steps = ['서비스 선택', '상세 정보', '일정/위치', '완료']

export default function Request() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ category: '', service: '', detail: '', date: '', location: '', name: '', phone: '' })

  const selectedCat = categories.find(c => c.id === form.category)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-2">견적 요청하기</h1>
      <p className="text-gray-500 text-sm mb-8">정보를 입력하면 전문 고수들이 견적을 보내드립니다.</p>

      {/* Progress bar */}
      <div className="flex items-center mb-10">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
              i < step ? 'bg-primary text-white' : i === step ? 'bg-primary text-white ring-4 ring-primary-light' : 'bg-gray-200 text-gray-500'
            }`}>
              {i < step ? <Check size={16} /> : i + 1}
            </div>
            <div className="flex-1 text-center">
              <div className={`text-xs font-medium ${i === step ? 'text-primary' : 'text-gray-400'}`}>{s}</div>
            </div>
            {i < steps.length - 1 && <div className={`h-0.5 flex-1 transition-all ${i < step ? 'bg-primary' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Category */}
      {step === 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">어떤 서비스가 필요하세요?</h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setForm(f => ({ ...f, category: cat.id, service: '' }))}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${form.category === cat.id ? 'border-primary bg-primary-light' : 'border-gray-200 bg-white hover:border-primary'}`}>
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <div className="font-bold text-sm text-gray-900">{cat.name}</div>
                  <div className="text-xs text-gray-500">{cat.services.length}가지 서비스</div>
                </div>
                {form.category === cat.id && <Check size={16} className="ml-auto text-primary" />}
              </button>
            ))}
          </div>
          {selectedCat && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3">세부 서비스 선택</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCat.services.map(svc => (
                  <button key={svc} onClick={() => setForm(f => ({ ...f, service: svc }))}
                    className={`text-sm px-4 py-2 rounded-full border transition-all ${form.service === svc ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-700 hover:border-primary'}`}>
                    {svc}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button disabled={!form.category || !form.service} onClick={() => setStep(1)}
            className="w-full mt-8 bg-primary text-white py-4 rounded-2xl font-bold text-sm disabled:opacity-40 hover:bg-primary-dark transition-colors">
            다음 단계 →
          </button>
        </div>
      )}

      {/* Step 1: Detail */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">서비스 상세 정보를 알려주세요</h2>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">선택한 서비스</label>
            <div className="bg-primary-light text-primary text-sm px-4 py-2 rounded-lg inline-block font-medium">
              {selectedCat?.icon} {form.service}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">요청 내용 <span className="text-red-500">*</span></label>
            <textarea
              value={form.detail}
              onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
              placeholder="원하시는 서비스 내용, 규모, 특이사항 등을 자세히 적어주세요."
              className="w-full border border-gray-200 rounded-xl p-4 text-sm outline-none focus:border-primary resize-none h-36"
            />
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={() => setStep(0)} className="flex-1 border border-gray-200 text-gray-700 py-4 rounded-2xl font-bold text-sm hover:bg-gray-50">이전</button>
            <button disabled={!form.detail.trim()} onClick={() => setStep(2)}
              className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold text-sm disabled:opacity-40 hover:bg-primary-dark transition-colors">
              다음 단계 →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Date/Location */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-6">일정과 위치를 알려주세요</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">희망 날짜</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">서비스 위치</label>
              <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="시/구/동 으로 입력해주세요. 예) 서울 강남구 역삼동"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">이름</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="홍길동"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">연락처</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="010-0000-0000"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-700 py-4 rounded-2xl font-bold text-sm hover:bg-gray-50">이전</button>
            <button disabled={!form.location || !form.name} onClick={() => setStep(3)}
              className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold text-sm disabled:opacity-40 hover:bg-primary-dark transition-colors">
              견적 요청하기
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 3 && (
        <div className="text-center py-10">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✅</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">견적 요청 완료!</h2>
          <p className="text-gray-500 mb-8">주변 고수들에게 견적 요청이 전달되었습니다.<br/>평균 1시간 내에 견적을 받으실 수 있어요.</p>
          <div className="bg-gray-50 rounded-2xl p-5 text-left mb-8">
            <h3 className="font-bold text-gray-900 mb-3">요청 내용 확인</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between"><span className="text-gray-500">서비스</span><span className="font-medium">{form.service}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">위치</span><span className="font-medium">{form.location}</span></div>
              {form.date && <div className="flex justify-between"><span className="text-gray-500">희망 날짜</span><span className="font-medium">{form.date}</span></div>}
            </div>
          </div>
          <Link to="/" className="block w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary-dark transition-colors">
            홈으로 돌아가기
          </Link>
        </div>
      )}
    </div>
  )
}
