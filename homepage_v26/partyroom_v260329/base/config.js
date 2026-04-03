/* ============================================
   PARTYROOM - Site Configuration
   메뉴, 라우트, 사이트 정보 설정
   ============================================ */

window.SITE_CONFIG = {
  name: '파티룸 스페이스',
  nameEn: 'PARTYROOM SPACE',
  tagline: '프리미엄 공간 대여 서비스',
  tel: '010-9998-0857',
  email: 'korea98781@gmail.com',
  address: '경기도 성남시 중원구 성남대로 997번길 49-14 201호',
  bank: { name: '기업은행', account: '123-456789-01-234', holder: '(주)파티룸스페이스' },

  topMenu: [
    { id: 'home',     label: '파티룸홈',  icon: '🏠' },
    { id: 'about',    label: '상품안내',  icon: '📋' },
    { id: 'products', label: '상품목록',  icon: '🗂️' },
    { id: 'detail',   label: '상품상세',  icon: '🔍' },
    { id: 'space',    label: '공간안내',  icon: '🏢' },
    { id: 'blog',     label: '블로그',    icon: '📝' },
    { id: 'location', label: '위치안내',  icon: '📍' },
    { id: 'contact',  label: '고객센터',  icon: '📞' },
    { id: 'faq',      label: 'FAQ',       icon: '❓' },
  ],

  sidebarMenu: [
    {
      section: '예약',
      items: [
        { id: 'home',     label: '파티룸홈',  icon: '🏠' },
        { id: 'booking',  label: '예약하기',  icon: '📅' },
      ]
    },
    {
      section: '공간',
      items: [
        { id: 'products', label: '상품목록',  icon: '🗂️' },
        { id: 'space',    label: '공간안내',  icon: '🏢' },
        { id: 'about',    label: '상품안내',  icon: '📋' },
      ]
    },
    {
      section: '정보',
      items: [
        { id: 'blog',     label: '블로그',    icon: '📝' },
        { id: 'location', label: '위치안내',  icon: '📍' },
        { id: 'contact',  label: '고객센터',  icon: '📞' },
        { id: 'faq',      label: 'FAQ',       icon: '❓' },
      ]
    }
  ],

  rooms: [
    {
      id: 1, name: '스탠다드 룸 A', emoji: '🎉',
      capacity: '2~8명',
      area: '28㎡',
      features: ['빔프로젝터', 'WiFi', '화이트보드', '냉난방'],
      tags: ['파티', '모임', '미팅'],
      hourly: 20000, daily: 140000,
      multiday: { days: 3, price: 350000, discount: '17%' },
    },
    {
      id: 2, name: '세미나 룸 B', emoji: '📊',
      capacity: '6~20명',
      area: '55㎡',
      features: ['대형 스크린', 'WiFi', '화이트보드', '마이크', '냉난방'],
      tags: ['세미나', '워크숍', '회의'],
      hourly: 45000, daily: 300000,
      multiday: { days: 3, price: 750000, discount: '17%' },
    },
    {
      id: 3, name: '스터디 룸 C', emoji: '📚',
      capacity: '1~6명',
      area: '18㎡',
      features: ['모니터', 'WiFi', '개인 조명', '냉난방', '콘센트'],
      tags: ['스터디', '독서실', '집중'],
      hourly: 12000, daily: 80000,
      multiday: { days: 3, price: 200000, discount: '17%' },
    },
    {
      id: 4, name: '파티 룸 D', emoji: '🎊',
      capacity: '8~30명',
      area: '80㎡',
      features: ['음향시스템', 'LED 조명', 'WiFi', '주방', '냉난방'],
      tags: ['파티', '촬영', '이벤트'],
      hourly: 80000, daily: 550000,
      multiday: { days: 3, price: 1380000, discount: '16%' },
    },
    {
      id: 5, name: '회의실 E', emoji: '💼',
      capacity: '4~12명',
      area: '36㎡',
      features: ['TV 모니터', 'WiFi', '화이트보드', '냉난방', '커피머신'],
      tags: ['회의', '미팅', '인터뷰'],
      hourly: 30000, daily: 200000,
      multiday: { days: 3, price: 500000, discount: '17%' },
    },
    {
      id: 6, name: '멀티 룸 F', emoji: '🎬',
      capacity: '2~15명',
      area: '45㎡',
      features: ['촬영조명', '4K TV', 'WiFi', '화이트보드', '냉난방'],
      tags: ['촬영', '포캐스트', '강의'],
      hourly: 55000, daily: 380000,
      multiday: { days: 3, price: 950000, discount: '17%' },
    },
  ],

  discounts: [
    { days: '3~6일', rate: '10% 할인', badge: 'SAVE 10%' },
    { days: '7~13일', rate: '20% 할인', badge: 'SAVE 20%' },
    { days: '14일 이상', rate: '30% 할인', badge: 'SAVE 30%' },
  ],

  faqs: [
    { q: '예약은 어떻게 하나요?', a: '홈페이지 예약 페이지에서 날짜와 공간을 선택 후 신청하시거나, 전화(010-9998-0857)로 예약 가능합니다.' },
    { q: '결제 방법은 무엇인가요?', a: '계좌이체만 가능합니다. 예약 확정 후 24시간 이내 아래 계좌로 입금해주세요.\n기업은행 123-456789-01-234 (주)파티룸스페이스' },
    { q: '취소 및 환불 정책이 어떻게 되나요?', a: '이용 7일 전 취소: 100% 환불 / 3~6일 전: 50% 환불 / 2일 이내: 환불 불가. 천재지변 등 불가항력적 사유는 예외입니다.' },
    { q: '장기 할인은 어떻게 적용되나요?', a: '3~6일 연속 이용 시 10%, 7~13일 20%, 14일 이상 30% 자동 할인됩니다. 예약 시 자동 계산됩니다.' },
    { q: '음식물 반입이 가능한가요?', a: '케이터링 업체 음식 반입 가능합니다. 단, 알코올류는 파티룸/멀티룸에 한해 가능합니다.' },
    { q: '주차 공간이 있나요?', a: '건물 지하 1~2층에 주차 가능합니다. 2시간 무료, 이후 시간당 2,000원입니다.' },
  ],
};
