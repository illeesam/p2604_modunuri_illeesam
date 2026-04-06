import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <h4 className="text-white font-bold mb-4">서비스</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/request" className="hover:text-white">견적 요청하기</Link></li>
              <li><Link to="/community" className="hover:text-white">커뮤니티</Link></li>
              <li><Link to="/market" className="hover:text-white">마켓</Link></li>
              <li><a href="#" className="hover:text-white">앱 다운로드</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">고수 서비스</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">고수 등록하기</a></li>
              <li><a href="#" className="hover:text-white">고수 가이드</a></li>
              <li><a href="#" className="hover:text-white">수익 계산기</a></li>
              <li><a href="#" className="hover:text-white">광고 상품</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">회사</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">회사 소개</a></li>
              <li><a href="#" className="hover:text-white">인재 채용</a></li>
              <li><a href="#" className="hover:text-white">공지사항</a></li>
              <li><a href="#" className="hover:text-white">고객센터</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">앱 다운로드</h4>
            <div className="space-y-2">
              <a href="#" className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2.5 rounded-lg transition-colors">
                <span>🍎</span> App Store
              </a>
              <a href="#" className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2.5 rounded-lg transition-colors">
                <span>🤖</span> Google Play
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="text-white font-black text-xl mb-2">숨고</div>
              <p className="text-xs leading-6">
                (주)숨고 | 대표: 구기호 | 사업자등록번호: 123-45-67890<br />
                서울특별시 강남구 테헤란로 123 숨고빌딩 | 고객센터: 1544-0000<br />
                © 2025 Soomgo Inc. All rights reserved.
              </p>
            </div>
            <div className="flex gap-4 text-xs">
              <a href="#" className="hover:text-white">이용약관</a>
              <a href="#" className="hover:text-white font-semibold text-gray-300">개인정보처리방침</a>
              <a href="#" className="hover:text-white">위치기반서비스</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
