import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { banners } from '../../data/banners'

export default function HeroBanner() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setCurrent(c => (c + 1) % banners.length), 4000)
    return () => clearInterval(timer)
  }, [])

  const prev = () => setCurrent(c => (c - 1 + banners.length) % banners.length)
  const next = () => setCurrent(c => (c + 1) % banners.length)
  const b = banners[current]

  return (
    <div className="relative h-64 md:h-80 overflow-hidden rounded-2xl mx-4 md:mx-0">
      <img src={b.img} alt={b.title} className="w-full h-full object-cover transition-all duration-500" />
      <div className={`absolute inset-0 bg-gradient-to-r ${b.bg} opacity-70`} />
      <div className="absolute inset-0 flex flex-col justify-center px-10">
        <h2 className="text-white text-2xl md:text-4xl font-black mb-2">{b.title}</h2>
        <p className="text-white/90 text-sm md:text-base mb-5">{b.subtitle}</p>
        <Link to={b.link} className="inline-block bg-white text-primary font-bold text-sm px-6 py-2.5 rounded-full w-fit hover:bg-primary-light transition-colors">
          {b.cta}
        </Link>
      </div>
      <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition-all">
        <ChevronLeft size={18} />
      </button>
      <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition-all">
        <ChevronRight size={18} />
      </button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {banners.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/50'}`} />
        ))}
      </div>
    </div>
  )
}
