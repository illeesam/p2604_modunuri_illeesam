/* ShopJoy - FO site config */

/* ── 프론트 사이트 번호 (실제 컴포넌트/파일 결정용. URL ID는 generic 사용) ── */
window.FO_SITE_NO = window.FO_SITE_NO || '01';

window.SITE_CONFIG = {
  "name": "ShopJoy",
  "tagline": "쇼핑의 즐거움",
  "tel": "010-3805-0206",
  "email": "illeesam@gmail.com",
  "address": "경기도 성남시 중원구 성남대로 997번길 49-14 201호",
  "bank": {
    "name": "카카오뱅크",
    "account": "3333-27-1234567",
    "holder": "송성일"
  },
  "categorys": [
    { "categoryId": "tops",       "categoryNm": "상의" },
    { "categoryId": "bottoms",    "categoryNm": "하의" },
    { "categoryId": "outer",      "categoryNm": "아우터" },
    { "categoryId": "dress",      "categoryNm": "원피스" },
    { "categoryId": "acc",        "categoryNm": "악세서리" }
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
