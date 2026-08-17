package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyContactDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String contactId;  // 문의ID 필터
        @Size(max = 21) private String memberId;  // 회원ID 필터
        @Size(max = 50) private String categoryCd;  // 문의유형 필터 — CONTACT_CATEGORY_KR {DELIVERY:배송 문의, PRODUCT:상품 문의, EXCHANGE_RETURN:교환·반품 문의, ORDER_PAYMENT:주문·결제 문의, ETC:기타 문의}
        @Size(max = 20) private String status;  // 처리상태 필터 — CONTACT_STATUS_CD {RECEIVED:접수, IN_PROGRESS:처리중, DONE:완료}
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_contact ──────────────────────────────────────────
        private String contactId;  // 문의ID (YYMMDDhhmmss+rand4)
        private String memberId;  // 회원ID
        private String memberNm;  // 문의자명
        private String categoryCd;  // 문의유형 — CONTACT_CATEGORY_KR {DELIVERY:배송 문의, PRODUCT:상품 문의, EXCHANGE_RETURN:교환·반품 문의, ORDER_PAYMENT:주문·결제 문의, ETC:기타 문의}
        private String contactTitle;  // 제목
        private String contactContent;  // 문의내용
        private String contactStatusCd;  // 처리상태 — CONTACT_STATUS_CD {RECEIVED:접수, IN_PROGRESS:처리중, DONE:완료}
        private String contactAnswer;  // 답변내용
        private String answerUserId;  // 답변자 (sy_user.user_id)
        private LocalDateTime answerDate;  // 답변일시
        private LocalDateTime contactDate;  // 문의일시
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────
    }

}
