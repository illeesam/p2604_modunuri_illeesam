/* ShopJoy - 의류 쇼핑몰 site config */

/* ── 프론트 사이트 번호 (실제 컴포넌트/파일 결정용. URL ID는 generic 사용) ── */
window.FRONT_SITE_NO = window.FRONT_SITE_NO || '01';

window.SITE_CONFIG = {
  "name": "ShopJoy",
  "nameEn": "SHOPJOY",
  "tagline": "쇼핑의 즐거움",
  "tel": "010-3805-0206",
  "email": "illeesam@gmail.com",
  "address": "경기도 성남시 중원구 성남대로 997번길 49-14 201호",
  "bank": {
    "name": "카카오뱅크",
    "account": "3333-27-1234567",
    "holder": "송성일"
  },
  "topMenu": [
    { "icon": "🏠", "menuId": "home",     "menuNm": "홈" },
    { "icon": "🗂️", "menuId": "prodList", "menuNm": "상품목록" },
    { "icon": "📝", "menuId": "order",    "menuNm": "주문하기" },
    { "icon": "📞", "menuId": "contact",  "menuNm": "고객센터" },
    { "icon": "❓", "menuId": "faq",      "menuNm": "FAQ" },
    { "icon": "🎉", "menuId": "event",   "menuNm": "이벤트" },
    { "icon": "📖", "menuId": "blog",    "menuNm": "블로그" },
    { "menuId": "divider-disp", "type": "divider" },
    { "menuId": "dispUi01", "menuNm": "전시ui1" },
    { "menuId": "dispUi02", "menuNm": "전시ui2" },
    { "menuId": "dispUi03", "menuNm": "전시ui3" },
    { "menuId": "dispUi04", "menuNm": "전시ui4" },
    { "menuId": "dispUi05", "menuNm": "전시ui5" },
    { "menuId": "dispUi06", "menuNm": "전시ui6" }
  ],
  "sidebarMenu": [
    {
      "section": "쇼핑",
      "items": [
        { "icon": "🏠", "menuId": "home",     "menuNm": "홈" },
        { "icon": "🗂️", "menuId": "prodList", "menuNm": "상품목록" }
      ]
    },
    {
      "section": "구매",
      "items": [
        { "icon": "📝", "menuId": "order", "menuNm": "주문하기" },
        { "icon": "👤", "menuId": "myOrder", "menuNm": "마이페이지", "authRequired": true }
      ]
    },
    {
      "section": "고객지원",
      "items": [
        { "icon": "📞", "menuId": "contact",  "menuNm": "고객센터" },
        { "icon": "❓", "menuId": "faq",      "menuNm": "FAQ" },
        { "icon": "📍", "menuId": "location", "menuNm": "위치안내" },
        { "icon": "🏢", "menuId": "about",    "menuNm": "회사소개" },
        { "icon": "🎉", "menuId": "event",    "menuNm": "이벤트" },
        { "icon": "📖", "menuId": "blog",     "menuNm": "블로그" }
      ]
    },
    {
      "section": "샘플 전시",
      "items": [
        { "icon": "🖼", "menuId": "dispUi01", "menuNm": "전시ui01" },
        { "icon": "🖼", "menuId": "dispUi02", "menuNm": "전시ui02" },
        { "icon": "🖼", "menuId": "dispUi03", "menuNm": "전시ui03" },
        { "icon": "🖼", "menuId": "dispUi04", "menuNm": "전시ui04" },
        { "icon": "🖼", "menuId": "dispUi05", "menuNm": "전시ui05" },
        { "icon": "🖼", "menuId": "dispUi06", "menuNm": "전시ui06" }
      ]
    }
  ],
  "categorys": [
    { "categoryId": "tops",       "categoryNm": "상의" },
    { "categoryId": "bottoms",    "categoryNm": "하의" },
    { "categoryId": "outer",      "categoryNm": "아우터" },
    { "categoryId": "dress",      "categoryNm": "원피스" },
    { "categoryId": "acc",        "categoryNm": "악세서리" }
  ],
  "imgBase": "assets/cdn/prod/img",
  "products": [
    {
      "productId": 1,
      "prodNm": "오버사이즈 코튼 티셔츠",
      "categoryId": "tops",
      "price": "29,900원",
      "originalPrice": 39900,
      "desc": "부드러운 100% 코튼 소재의 여유로운 오버핏 티셔츠. 데일리룩으로 완벽한 베이직 아이템.",
      "image": "assets/cdn/prod/img/shop/product/fashion/fashion-1.webp",
      "images": ["assets/cdn/prod/img/shop/product/fashion/fashion-1.webp","assets/cdn/prod/img/shop/product/fashion/fashion-2.webp","assets/cdn/prod/img/shop/product/fashion/fashion-3.webp"],
      "badge": "NEW",
      "opt1s": [
        { "name": "블랙",  "hex": "#1a1a1a" },
        { "name": "화이트", "hex": "#f5f0eb", "priceDelta": 2000 },
        { "name": "네이비", "hex": "#1e3a5f" },
        { "name": "베이지", "hex": "#d4b896", "priceDelta": 3000 }
      ],
      "opt2s": ["XS", "S", "M", "L", "XL"],
      "opt2Prices": { "XL": 2000 },
      "tags": ["코튼", "오버핏", "베이직"]
    },
    {
      "productId": 2,
      "prodNm": "슬림핏 데님 진",
      "categoryId": "bottoms",
      "price": "59,900원",
      "originalPrice": 79000,
      "desc": "클래식한 슬림핏 데님. 신축성 있는 소재로 활동성이 뛰어나며 어떤 상의와도 잘 어울립니다.",
      "image": "assets/cdn/prod/img/shop/product/fashion/fashion-4.webp",
      "images": ["assets/cdn/prod/img/shop/product/fashion/fashion-4.webp","assets/cdn/prod/img/shop/product/fashion/fashion-5.webp","assets/cdn/prod/img/shop/product/fashion/fashion-6.webp"],
      "badge": "인기",
      "opt1s": [
        { "name": "라이트블루", "hex": "#7bafd4" },
        { "name": "미드블루",   "hex": "#3f6fa8", "priceDelta": 2000 },
        { "name": "다크블루",   "hex": "#1e3a5f", "priceDelta": 4000 },
        { "name": "블랙",       "hex": "#1a1a1a", "priceDelta": 5000 }
      ],
      "opt2s": ["XS", "S", "M", "L", "XL", "XXL"],
      "opt2Prices": { "XL": 2000, "XXL": 4000 },
      "tags": ["데님", "슬림핏", "스트레치"]
    },
    {
      "productId": 3,
      "prodNm": "울 블렌드 롱코트",
      "categoryId": "outer",
      "price": "119,000원",
      "desc": "고급 울 혼방 소재로 제작한 클래식 롱코트. 세련된 실루엣으로 어떤 코디에도 품격을 더합니다.",
      "image": "assets/cdn/prod/img/shop/product/fashion/fashion-7.webp",
      "images": ["assets/cdn/prod/img/shop/product/fashion/fashion-7.webp","assets/cdn/prod/img/shop/product/fashion/fashion-8.webp","assets/cdn/prod/img/shop/product/fashion/fashion-9.webp"],
      "badge": "",
      "opt1s": [
        { "name": "카멜",  "hex": "#c19a6b" },
        { "name": "블랙",  "hex": "#1a1a1a", "priceDelta": 5000 },
        { "name": "차콜",  "hex": "#3a3a3a", "priceDelta": 5000 },
        { "name": "크림",  "hex": "#f5f0e8" }
      ],
      "opt2s": ["S", "M", "L", "XL"],
      "tags": ["울", "롱코트", "클래식"]
    },
    {
      "productId": 4,
      "prodNm": "플로럴 미디 드레스",
      "categoryId": "dress",
      "price": "79,000원",
      "originalPrice": 99000,
      "desc": "화사한 플로럴 패턴의 미디 기장 드레스. 봄·여름 나들이 및 특별한 날에 어울리는 로맨틱한 아이템.",
      "image": "assets/cdn/prod/img/shop/product/fashion/fashion-10.webp",
      "images": ["assets/cdn/prod/img/shop/product/fashion/fashion-10.webp","assets/cdn/prod/img/shop/product/fashion/fashion-11.webp","assets/cdn/prod/img/shop/product/fashion/fashion-12.webp"],
      "badge": "NEW",
      "opt1s": [
        { "name": "핑크플로럴",  "hex": "#e8a0b4" },
        { "name": "블루플로럴",  "hex": "#a0b8e8", "priceDelta": 3000 },
        { "name": "화이트플로럴","hex": "#f5f5f0" }
      ],
      "opt2s": ["XS", "S", "M", "L"],
      "opt2Prices": { "L": 3000 },
      "tags": ["플로럴", "미디기장", "로맨틱"]
    },
    {
      "productId": 5,
      "prodNm": "스트라이프 린넨 셔츠",
      "categoryId": "tops",
      "price": "45,000원",
      "desc": "시원한 린넨 소재에 클래식한 스트라이프 패턴. 여름철 가볍고 시원하게 입을 수 있는 셔츠.",
      "image": "assets/cdn/prod/img/shop/product/product_5.png",
      "images": ["assets/cdn/prod/img/shop/product/product_5.png","assets/cdn/prod/img/shop/product/product_6.png","assets/cdn/prod/img/shop/product/product_7.png"],
      "badge": "",
      "opt1s": [
        { "name": "화이트네이비", "hex": "#e8eef5" },
        { "name": "베이지브라운", "hex": "#e8ddd0" },
        { "name": "화이트블랙",   "hex": "#f0f0f0" }
      ],
      "opt2s": ["S", "M", "L", "XL", "XXL"],
      "opt2Prices": { "XL": 2000, "XXL": 4000 },
      "tags": ["린넨", "스트라이프", "여름"]
    },
    {
      "productId": 6,
      "prodNm": "카고 와이드 팬츠",
      "categoryId": "bottoms",
      "price": "55,000원",
      "originalPrice": 69000,
      "desc": "트렌디한 카고 디테일의 와이드 팬츠. 넉넉한 핏으로 편안하면서도 스타일리시한 룩을 완성합니다.",
      "image": "assets/cdn/prod/img/shop/product/product_8.png",
      "images": ["assets/cdn/prod/img/shop/product/product_8.png","assets/cdn/prod/img/shop/product/product_9.png","assets/cdn/prod/img/shop/product/product_10.png"],
      "badge": "인기",
      "opt1s": [
        { "name": "카키",  "hex": "#6b7c4a" },
        { "name": "블랙",  "hex": "#1a1a1a", "priceDelta": 3000 },
        { "name": "베이지","hex": "#d4c4a8" },
        { "name": "그레이","hex": "#8a8a8a", "priceDelta": 2000 }
      ],
      "opt2s": ["XS", "S", "M", "L", "XL"],
      "opt2Prices": { "L": 2000, "XL": 3000 },
      "tags": ["카고", "와이드핏", "트렌디"]
    },
    {
      "productId": 7,
      "prodNm": "퀼티드 숏 점퍼",
      "categoryId": "outer",
      "price": "89,000원",
      "desc": "보온성이 뛰어난 퀼티드 숏 점퍼. 캐주얼하면서도 세련된 디자인으로 데일리 아우터로 활용하세요.",
      "image": "assets/cdn/prod/img/shop/product/product_11.png",
      "images": ["assets/cdn/prod/img/shop/product/product_11.png","assets/cdn/prod/img/shop/product/product_12.png","assets/cdn/prod/img/shop/product/product_13.png"],
      "badge": "",
      "opt1s": [
        { "name": "블랙",  "hex": "#1a1a1a" },
        { "name": "올리브","hex": "#5a6a3a" },
        { "name": "버건디","hex": "#7a1a2a" },
        { "name": "크림",  "hex": "#f5f0e8" }
      ],
      "opt2s": ["S", "M", "L", "XL"],
      "tags": ["퀼티드", "숏점퍼", "보온"]
    },
    {
      "productId": 8,
      "prodNm": "케이블 니트 스웨터",
      "categoryId": "tops",
      "price": "49,000원",
      "desc": "포근한 케이블 니트 패턴의 스웨터. 가을·겨울 필수 아이템으로 다양한 하의와 코디하기 좋습니다.",
      "image": "assets/cdn/prod/img/shop/product/product_14.png",
      "images": ["assets/cdn/prod/img/shop/product/product_14.png","assets/cdn/prod/img/shop/product/product_15.png","assets/cdn/prod/img/shop/product/product_16.png"],
      "badge": "",
      "opt1s": [
        { "name": "아이보리", "hex": "#f5f0e0" },
        { "name": "카멜",     "hex": "#c19a6b" },
        { "name": "그레이",   "hex": "#8a8a8a" },
        { "name": "버건디",   "hex": "#7a1a2a" },
        { "name": "네이비",   "hex": "#1e3a5f" }
      ],
      "opt2s": ["XS", "S", "M", "L", "XL"],
      "tags": ["니트", "케이블", "가을겨울"]
    }
  ],
  "faqs": [
    {
      "q": "주문 후 배송까지 얼마나 걸리나요?",
      "a": "결제 확인 후 1~2 영업일 이내 출고됩니다. 출고 후 일반 배송은 2~3일, 제주·도서산간 지역은 추가 2~3일이 소요됩니다."
    },
    {
      "q": "교환·반품은 어떻게 신청하나요?",
      "a": "상품 수령 후 7일 이내에 고객센터로 연락해주세요. 단, 착용 후 세탁하거나 태그를 제거한 경우 교환·반품이 불가합니다."
    },
    {
      "q": "사이즈 교환이 가능한가요?",
      "a": "미착용·미세탁 상태에서 7일 이내라면 사이즈 교환이 가능합니다. 왕복 배송비는 고객 부담이며, 재고 상황에 따라 불가한 경우도 있습니다."
    },
    {
      "q": "색상이 화면과 다를 수 있나요?",
      "a": "모니터 환경에 따라 실제 색상과 다소 차이가 있을 수 있습니다. 정확한 색상은 상품 상세 이미지를 참고하거나 고객센터로 문의해주세요."
    },
    {
      "q": "세탁 방법은 어떻게 되나요?",
      "a": "각 상품의 라벨에 표기된 세탁 방법을 따라주세요. 대부분의 상품은 찬물 손세탁 또는 세탁기 약세탁을 권장합니다."
    },
    {
      "q": "결제는 어떤 방식으로 하나요?",
      "a": "현재 계좌이체 방식으로 운영됩니다. 주문 후 안내된 계좌로 입금해주시면 확인 후 발송합니다."
    }
  ],
  "codes": [
    { "codeId": 1, "codeGrp": "shopjoy_contact_inquiry", "codeValue": "주문·결제 문의",  "codeLabel": "주문·결제 문의" },
    { "codeId": 2, "codeGrp": "shopjoy_contact_inquiry", "codeValue": "배송 문의",       "codeLabel": "배송 문의" },
    { "codeId": 3, "codeGrp": "shopjoy_contact_inquiry", "codeValue": "교환·반품 문의",  "codeLabel": "교환·반품 문의" },
    { "codeId": 4, "codeGrp": "shopjoy_contact_inquiry", "codeValue": "상품 문의",       "codeLabel": "상품 문의" },
    { "codeId": 5, "codeGrp": "shopjoy_contact_inquiry", "codeValue": "기타 문의",       "codeLabel": "기타 문의" }
  ]
};
