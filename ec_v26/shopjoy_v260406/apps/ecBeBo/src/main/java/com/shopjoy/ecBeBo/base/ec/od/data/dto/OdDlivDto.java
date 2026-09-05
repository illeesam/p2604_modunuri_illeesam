package com.shopjoy.ecBeBo.base.ec.od.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class OdDlivDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String dlivId;  // 배송ID 필터
        @Size(max = 21) private String orderId;        // 상위 FK 필터
        private List<String> orderIds;                 // 상위 FK 다건 IN
        @Size(max = 21)  private String memberId;       // 회원 ID 필터
        @Size(max = 200) private String memberNm;      // 회원명 LIKE 필터 (직접 입력 시)
        @Size(max = 21)  private String vendorId;      // 업체 ID 필터
        @Size(max = 200) private String vendorNm;      // 업체명 LIKE 필터 (직접 입력 시)
        @Size(max = 20)  private String dlivStatusCd;  // 배송상태 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String dlivId;  // 배송ID (YYMMDDhhmmss+rand4)
        private String orderId;  // 주문ID (od_order.)
        private String vendorId;  // 출고 업체ID (벤더별 분리출고 시)
        private String dlivTypeCd;  // 배송유형 — DLIV_TYPE_CD {NORMAL:정상출고, RETURN:반품수거, EXCHANGE:교환수거, EXCHANGE_OUT:교환발송}
        private String dlivDivCd;  // 입출고구분 — DLIV_DIV_CD {OUTBOUND:출고, INBOUND:입고}
        private String dlivStatusCd;  // 배송상태 — DLIV_STATUS {READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패}
        private String dlivStatusCdBefore;  // 변경 전 배송상태 — DLIV_STATUS
        private String outboundCourierCd;  // 출고(발송) 택배사 — COURIER {CJ:CJ대한통운, LOTTE:롯데택배, HANJIN:한진택배 외}
        private String outboundTrackingNo;  // 출고(발송) 송장번호
        private LocalDateTime dlivShipDate;  // 출고일시
        private LocalDateTime dlivDate;  // 배송완료일시
        private Long shippingFee;  // 배송료 (현재값)
        private String inboundCourierCd;  // 반입 택배사 (반품일 때만) — COURIER
        private String inboundTrackingNo;  // 반입 송장번호
        private LocalDateTime inboundDate;  // 반입 완료일시
        private String recvNm;  // 수령자명
        private String recvPhone;  // 수령자연락처
        private String recvZip;  // 우편번호
        private String recvAddr;  // 주소
        private String recvAddrDetail;  // 상세주소
        private String recvMemo;  // 배송메모
        private String dlivMemo;  // 메모 (HTML 에디터)
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        private String memberNm;  // 주문자명 (od_order 조인)
        private LocalDateTime orderDate;  // 주문일시 (od_order 조인)
        private String orderStatusCd;  // 주문상태 (od_order 조인) — ORDER_STATUS_CD
        private String vendorNm;  // 업체명 (sy_vendor 조인)
        private String vendorTel;  // 업체 연락처 (sy_vendor 조인)
        private String dlivStatusCdNm;  // 배송상태 코드 라벨
        private String dlivTypeCdNm;  // 배송유형 코드 라벨
        private String dlivDivCdNm;  // 입출고구분 코드 라벨
        private String outboundCourierCdNm;  // 출고택배사 코드 라벨
        private String inboundCourierCdNm;  // 반입택배사 코드 라벨
        // ── 연관정보 (getById / 목록 시 채움) ──
        private List<OdDlivItemDto.Item> dlivItems;   // 배송상품 목록
    }

}
