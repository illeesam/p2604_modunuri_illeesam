export const pros = [
  {
    id: 1, name: '김민준', category: 'cleaning', service: '거주 청소',
    rating: 4.9, reviewCount: 347, responseRate: 98, avgPrice: '85,000원~',
    location: '강남구', career: '경력 8년',
    tags: ['당일예약가능', '주말가능', '친절'],
    bio: '안녕하세요! 8년 경력의 청소 전문가 김민준입니다. 고객님의 소중한 공간을 깔끔하게 관리해드립니다.',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
    portfolio: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&q=80',
    ],
    certifications: ['청소전문가 자격증', '위생관리사'],
    services: [
      { name: '원룸 청소', price: '50,000원~' },
      { name: '투룸 청소', price: '80,000원~' },
      { name: '쓰리룸 청소', price: '110,000원~' },
    ]
  },
  {
    id: 2, name: '이수현', category: 'interior', service: '도배',
    rating: 4.8, reviewCount: 215, responseRate: 95, avgPrice: '120,000원~',
    location: '서초구', career: '경력 12년',
    tags: ['무료상담', '최저가보장'],
    bio: '12년 경력 도배 전문 업체입니다. 합리적인 가격에 깔끔한 시공을 약속드립니다.',
    img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80',
    portfolio: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&q=80',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80',
    ],
    certifications: ['인테리어 기사'],
    services: [
      { name: '원룸 도배', price: '20만원~' },
      { name: '투룸 도배', price: '35만원~' },
    ]
  },
  {
    id: 3, name: '박지원', category: 'tutoring', service: '수학 과외',
    rating: 5.0, reviewCount: 128, responseRate: 100, avgPrice: '40,000원/시간',
    location: '송파구', career: '경력 5년',
    tags: ['서울대졸', '수능만점'],
    bio: '서울대 수학교육과 출신. 개념부터 탄탄하게! 수능 수학 1등급 만들어 드립니다.',
    img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&q=80',
    portfolio: [],
    certifications: ['수학교육과 졸업', '교원자격증'],
    services: [
      { name: '중등 수학', price: '35,000원/시간' },
      { name: '고등 수학', price: '45,000원/시간' },
    ]
  },
  {
    id: 4, name: '최영훈', category: 'moving', service: '가정이사',
    rating: 4.7, reviewCount: 489, responseRate: 92, avgPrice: '30만원~',
    location: '마포구', career: '경력 15년',
    tags: ['파손보상', '친절한팀'],
    bio: '15년 경력의 믿을 수 있는 이사 전문 업체! 파손 없는 안전한 이사를 보장합니다.',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80',
    portfolio: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    ],
    certifications: ['이사화물운송종사자격증'],
    services: [
      { name: '원룸 이사', price: '15만원~' },
      { name: '투룸 이사', price: '30만원~' },
      { name: '쓰리룸 이상', price: '50만원~' },
    ]
  },
  {
    id: 5, name: '정소영', category: 'wedding', service: '웨딩 촬영',
    rating: 4.9, reviewCount: 203, responseRate: 97, avgPrice: '80만원~',
    location: '강남구', career: '경력 7년',
    tags: ['드라마틱', '자연스러운'],
    bio: '7년간 웨딩 촬영만 전문으로 해온 사진작가입니다. 두 분의 아름다운 순간을 영원히 담아드립니다.',
    img: 'https://images.unsplash.com/photo-1494790108755-2616b612b632?w=300&q=80',
    portfolio: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80',
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&q=80',
    ],
    certifications: ['사진 기사'],
    services: [
      { name: '본식 스냅', price: '80만원~' },
      { name: '야외 촬영', price: '50만원~' },
    ]
  },
  {
    id: 6, name: '한동욱', category: 'outsourcing', service: '웹사이트 제작',
    rating: 4.8, reviewCount: 156, responseRate: 96, avgPrice: '150만원~',
    location: '성동구', career: '경력 9년',
    tags: ['반응형','SEO최적화','빠른납품'],
    bio: '9년 경력 풀스택 개발자. 쇼핑몰, 기업 홈페이지, 랜딩페이지 전문. 빠르고 퀄리티 있게!',
    img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&q=80',
    portfolio: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
    ],
    certifications: ['정보처리기사', 'AWS Solutions Architect'],
    services: [
      { name: '랜딩페이지', price: '50만원~' },
      { name: '쇼핑몰', price: '150만원~' },
      { name: '기업 홈페이지', price: '200만원~' },
    ]
  },
  {
    id: 7, name: '오미래', category: 'pet', service: '반려동물 훈련',
    rating: 5.0, reviewCount: 89, responseRate: 99, avgPrice: '60,000원/회',
    location: '용산구', career: '경력 6년',
    tags: ['긍정강화','출장가능'],
    bio: '행동교정 전문 트레이너. 공격성, 짖음, 대소변 등 모든 문제 행동을 해결해드립니다.',
    img: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&q=80',
    portfolio: [
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
    ],
    certifications: ['반려동물행동교정사 1급'],
    services: [
      { name: '기초훈련 1회', price: '60,000원' },
      { name: '5회 패키지', price: '280,000원' },
    ]
  },
  {
    id: 8, name: '강태양', category: 'car', service: '자동차 광택',
    rating: 4.6, reviewCount: 312, responseRate: 90, avgPrice: '10만원~',
    location: '강서구', career: '경력 10년',
    tags: ['당일완료','출장세차'],
    bio: '광택/코팅 전문 업체. 10년 노하우로 새 차처럼! 출장 서비스 가능합니다.',
    img: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&q=80',
    portfolio: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80',
    ],
    certifications: ['자동차정비기능사'],
    services: [
      { name: '유리막코팅', price: '10만원~' },
      { name: '세라믹코팅', price: '50만원~' },
    ]
  },
  {
    id: 9, name: '윤지혜', category: 'job', service: '자기소개서 첨삭',
    rating: 4.9, reviewCount: 178, responseRate: 98, avgPrice: '50,000원~',
    location: '종로구', career: '경력 4년',
    tags: ['현직HR','대기업합격','빠른피드백'],
    bio: '삼성, LG, 현대 등 대기업 합격생 다수 배출! 현직 HR 출신의 자소서 전문 첨삭.',
    img: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&q=80',
    portfolio: [],
    certifications: ['경영학 석사', '직업상담사 2급'],
    services: [
      { name: '자소서 첨삭 1개', price: '30,000원' },
      { name: '자소서 5개 패키지', price: '120,000원' },
      { name: '면접 코칭', price: '80,000원/시간' },
    ]
  },
  {
    id: 10, name: '임현석', category: 'startup', service: '사업계획서',
    rating: 4.7, reviewCount: 94, responseRate: 93, avgPrice: '30만원~',
    location: '여의도', career: '경력 8년',
    tags: ['투자유치경험','VC출신'],
    bio: 'VC 출신 창업 전문 컨설턴트. 투자유치, 정부지원금, 사업계획서 작성 전문.',
    img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=80',
    portfolio: [],
    certifications: ['경영컨설팅사', 'MBA'],
    services: [
      { name: '사업계획서', price: '30만원~' },
      { name: 'IR 덱 제작', price: '50만원~' },
    ]
  },
]
