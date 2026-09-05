package com.shopjoy.ecBeBo.base.sy.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyVocDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 검색값
        @Size(max = 21) private String vocId;  // VOC분류ID 검색값
        @Size(max = 50) private String vocMasterCd;  // VOC마스터코드 검색값 — VOC_MASTER_CD {DELIVERY:배송, PRODUCT:상품, PAYMENT:결제, CLAIM:클레임, SERVICE:서비스, ETC:기타}
        @Size(max = 50) private String vocDetailCd;  // VOC세부코드 검색값 — VOC_DETAIL_CD {DELIVERY_DELAY:배송지연, DELIVERY_LOST:배송분실, DELIVERY_DAMAGE:배송파손, PRODUCT_DEFECT:상품불량, PRODUCT_WRONG:오배송, PRODUCT_INFO:상품정보오류, PAYMENT_FAIL:결제실패, PAYMENT_REFUND:환불요청 외 5개}
        @Size(max = 1)  private String useYn;  // 사용여부 검색값 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_voc ──────────────────────────────────────────
        private String vocId;  // VOC분류ID (YYMMDDhhmmss+rand4)
        private String vocMasterCd;  // VOC마스터코드 — VOC_MASTER_CD {DELIVERY:배송, PRODUCT:상품, PAYMENT:결제, CLAIM:클레임, SERVICE:서비스, ETC:기타}
        private String vocDetailCd;  // VOC세부코드 — VOC_DETAIL_CD {DELIVERY_DELAY:배송지연, DELIVERY_LOST:배송분실, DELIVERY_DAMAGE:배송파손, PRODUCT_DEFECT:상품불량, PRODUCT_WRONG:오배송, PRODUCT_INFO:상품정보오류, PAYMENT_FAIL:결제실패, PAYMENT_REFUND:환불요청 외 5개}
        private String vocNm;  // VOC항목명
        private String vocContent;  // VOC항목설명
        private String useYn;  // 사용여부 Y/N
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────
    }

}
