import HeroBanner from '../components/home/HeroBanner'
import PresetServices from '../components/home/PresetServices'
import RecommendedPros from '../components/home/RecommendedPros'
import PopularCategories from '../components/home/PopularCategories'
import NearbyContent from '../components/home/NearbyContent'
import CommunityPreview from '../components/home/CommunityPreview'

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <HeroBanner />
      <PresetServices />
      <PopularCategories />
      <RecommendedPros />
      <NearbyContent />
      <CommunityPreview />

      {/* App download banner */}
      <section className="my-10 bg-gradient-to-r from-primary to-blue-400 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-white">
          <h3 className="text-2xl font-black mb-2">숨고 앱으로 더 편리하게!</h3>
          <p className="text-white/80">언제 어디서나 빠르게 견적 받고, 고수를 찾아보세요.</p>
        </div>
        <div className="flex gap-3">
          <a href="#" className="flex items-center gap-2 bg-white text-primary font-bold text-sm px-5 py-3 rounded-full hover:bg-primary-light transition-colors">
            🍎 App Store
          </a>
          <a href="#" className="flex items-center gap-2 bg-white text-primary font-bold text-sm px-5 py-3 rounded-full hover:bg-primary-light transition-colors">
            🤖 Google Play
          </a>
        </div>
      </section>
    </div>
  )
}
