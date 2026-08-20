package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdProdHistDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String histId;    // 이력ID 필터 (하위 이력 테이블 PK 공용)
        @Size(max = 21) private String prodId;    // 상품ID 필터 (필수 — 상품별 이력 조회)
        @Size(max = 21) private String siteId;    // 사이트ID 필터
    }

    /**
     * 상품 상세화면 "이력" 탭에서 연관주문/재고/가격/상태/변경 5종 이력을 한 Item 모델로 통합 조회한다
     * (PdProdHistQueryRepository 참조). 각 select* 메서드가 채우는 필드만 값이 들어오고 나머지는 null.
     */
    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String histId;              // 이력ID (하위 이력 테이블 PK — 재고/상태/변경 이력에서 사용)
        private String prodId;              // 상품ID
        private LocalDateTime histDate;     // 이력 발생일시 (재고/가격/상태/변경 이력 공통 chg_date·proc_date)
        private String regBy;               // 처리자ID (chg_by/proc_user_id)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String regByNm;             // 처리자명 (조인 표시용)
        private String stockTypeCd;         // 재고변동사유 — CHG_REASON_CD {SALE:판매, PURCHASE:입고, RETURN:반품, EXCHANGE:교환, ADJUST:조정, CLAIM:클레임, ADMIN:관리자조정}
        private String stockTypeCdNm;       // 재고변동사유 코드라벨 (조인 표시용)
        private Integer stockQty;           // 재고 변동 수량
        private Integer stockBalance;       // 변동 후 재고 잔량
        private String stockMemo;           // 재고 변동 사유 메모
        private String priceField;          // 가격 변경 항목명 (chg_reason)
        private String priceBefore;         // 변경 전 가격
        private String priceAfter;          // 변경 후 가격
        private String statusCdBefore;      // 변경 전 상품상태 — PRODUCT_STATUS {ON_SALE:판매중, PREPARING:준비중, SOLD_OUT:품절, SUSPENDED:판매중지}
        private String statusCdBeforeNm;    // 변경 전 상품상태 코드라벨 (조인 표시용)
        private String statusCdAfter;       // 변경 후 상품상태 — PRODUCT_STATUS {ON_SALE:판매중, PREPARING:준비중, SOLD_OUT:품절, SUSPENDED:판매중지}
        private String statusCdAfterNm;     // 변경 후 상품상태 코드라벨 (조인 표시용)
        private String changeField;         // 변경 항목 유형코드 (chg_type_cd — 일반 상품정보 변경 이력)
        private String changeBefore;        // 변경 전 값
        private String changeAfter;         // 변경 후 값
        private String orderId;             // 연관 주문ID (od_order.order_id)
        private String memberId;            // 주문 회원ID
        private String memberNm;            // 주문 회원명 (조인 표시용)
        private LocalDateTime orderDate;    // 주문일시
        private Long totalAmt;              // 주문 총금액
        private String orderStatusCd;       // 주문상태 — ORDER_STATUS_CD {PENDING:입금대기, PAID:결제완료, PREPARING:상품준비, SHIPPED:배송중, COMPLT:구매확정, DELIVERED:배송완료, CANCELLED:주문취소, AUTO_CANCELLED:자동취소}
        private String orderStatusCdNm;     // 주문상태 코드라벨 (조인 표시용)
        private Integer orderQty;           // 주문 품목 수량
    }

}
