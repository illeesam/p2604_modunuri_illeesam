package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class PmCacheDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;      // 사이트ID
        @Size(max = 21) private String cacheId;      // 적립금ID 필터
        @Size(max = 21) private String memberId;     // 회원ID 필터
        @Size(max = 20) private String cacheTypeCd;  // 유형 — CACHE_TYPE_CD {EARN_ADMIN:관리자 지급, EARN_EVENT:이벤트 지급, USE_ORDER:주문 사용, REFUND:환불 복원, EXPIRE:소멸, ADMIN_ADJ:관리자조정, BONUS:보너스, CHARGE:충전 외 1개}
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String cacheId;          // 적립금ID (YYMMDDhhmmss+rand4)
        private String memberId;         // 회원ID
        private String memberNm;         // 회원명
        private String cacheTypeCd;      // 유형 — CACHE_TYPE_CD {EARN_ADMIN:관리자 지급, EARN_EVENT:이벤트 지급, USE_ORDER:주문 사용, REFUND:환불 복원, EXPIRE:소멸, ADMIN_ADJ:관리자조정, BONUS:보너스, CHARGE:충전 외 1개}
        private Long cacheAmt;           // 금액 (양수:적립 / 음수:차감)
        private Long balanceAmt;         // 처리후 잔액
        private String refId;            // 참조ID (주문ID 등)
        private String cacheDesc;        // 내역 설명
        private String procUserId;       // 처리자 (관리자 직접 부여시)
        private LocalDateTime cacheDate; // 처리일시
        private LocalDate expireDate;    // 소멸예정일
        private String regBy;            // 등록자
        private LocalDateTime regDate;   // 등록일
        private String regSiteId;        // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;            // 수정자
        private LocalDateTime updDate;   // 수정일
    }


    /** 캐쉬 잔액 응답 — { "balance": 1000 } */
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class BalanceRes {
        private long balance;   // 현재 회원 캐쉬(충전금) 잔액
    }
}
