package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdDlivTmpltDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;         // 사이트ID 필터
        @Size(max = 1) private String useYn;            // 사용여부 필터 Y/N
        @Size(max = 20) private String dlivMethodCd;    // 배송방법 필터 — DLIV_METHOD_CD {COURIER:택배, DIRECT:직접배송, PICKUP:방문수령}
        @Size(max = 21) private String dlivTmpltId;     // 배송템플릿ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String dlivTmpltId;         // 배송템플릿ID (YYMMDDhhmmss+rand4)
        private String vendorId;            // 업체ID (sy_vendor.vendor_id)
        private String dlivTmpltNm;         // 템플릿명
        private String dlivMethodCd;        // 배송방법코드 — DLIV_METHOD_CD {COURIER:택배, DIRECT:직접배송, PICKUP:방문수령}
        private String dlivMethodCdNm;  // 코드 라벨
        private String dlivPayTypeCd;       // 배송비결제유형 — DLIV_PAY_TYPE_CD {PREPAY:선불, COD:착불}
        private String dlivPayTypeCdNm;  // 코드 라벨
        private String dlivCourierCd;       // 배송 택배사 코드
        private Long dlivCost;              // 기본 배송비
        private Long freeDlivMinAmt;        // 무료배송 최소 주문금액
        private Long islandExtraCost;       // 도서산간 추가배송비
        private Long returnCost;            // 반품배송비 (편도)
        private Long exchangeCost;          // 교환배송비 (왕복=반품+재발송)
        private String returnCourierCd;     // 반품 택배사 코드
        private String returnAddrZip;       // 반품지 우편번호
        private String returnAddr;          // 반품지 주소
        private String returnAddrDetail;    // 반품지 상세주소
        private String returnTelNo;         // 반품지 전화번호
        private String baseDlivYn;          // 기본배송지여부 Y/N
        private String useYn;               // 사용여부 Y/N
        private String regBy;               // 등록자
        private LocalDateTime regDate;      // 등록일
        private String regSiteId;           // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;               // 수정자
        private LocalDateTime updDate;      // 수정일
    }

}
