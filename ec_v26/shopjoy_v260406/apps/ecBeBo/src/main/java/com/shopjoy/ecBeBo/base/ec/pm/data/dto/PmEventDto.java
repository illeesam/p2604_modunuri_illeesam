package com.shopjoy.ecBeBo.base.ec.pm.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class PmEventDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;   // 사이트ID
        @Size(max = 1) private String useYn;     // 사용여부 필터 Y/N
        @Size(max = 21) private String eventId;  // 이벤트ID 필터
        private List<String> eventIds;             // PK 다건 IN
        @Size(max = 20) private String eventStatusCd;  // 상태 필터 — EVENT_STATUS_CD {PENDING:대기, ACTIVE:진행중, ENDED:종료, INACTIVE:비활성}
        @Size(max = 21)  private String prodId;     // 상품 기준 필터 (EXISTS eq via pm_event_prod)
        @Size(max = 200) private String prodNm;     // 상품명 기준 필터 (EXISTS LIKE via pm_event_prod→pd_prod)
        @Size(max = 21)  private String vendorId;  // 업체 ID 필터 (EXISTS eq via pm_event_prod→pd_prod)
        @Size(max = 200) private String vendorNm;  // 업체명 필터 (EXISTS LIKE via pm_event_prod→pd_prod→sy_vendor)
        @Size(max = 21)  private String mdUserId;  // 담당MD ID 필터 (EXISTS eq via pm_event_prod→pd_prod)
        @Size(max = 200) private String mdUserNm;  // 담당MD명 필터 (EXISTS LIKE via pm_event_prod→pd_prod→sy_user)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String eventId;             // 이벤트ID (YYMMDDhhmmss+rand4)
        private String eventNm;             // 이벤트명
        private String eventTypeCd;         // 이벤트유형 — EVENT_TYPE_CD {DISCOUNT:할인 이벤트, GIFT:증정 이벤트, CACHE:적립 이벤트, ADULT:성인, APP:앱전용, BLACK_FRI:블랙프라이데이, CHUSEOK:추석, COUPLE:커플 외 32개}
        private String imgUrl;              // 배너이미지URL
        private String eventTitle;          // 이벤트 제목
        private String eventContent;        // 이벤트 상세내용
        private LocalDate startDate;        // 이벤트 시작일
        private LocalDate endDate;          // 이벤트 종료일
        private LocalDate noticeStart;      // 예고 시작일
        private LocalDate noticeEnd;        // 예고 종료일
        private String eventStatusCd;       // 상태 — EVENT_STATUS_CD {PENDING:대기, ACTIVE:진행중, ENDED:종료, INACTIVE:비활성}
        private String eventStatusCdBefore; // 변경 전 이벤트상태
        private String targetTypeCd;        // 대상유형 — EVENT_TARGET {ALL:전체, NEW_MEMBER:신규회원, VIP:VIP회원}
        private Integer sortOrd;            // 정렬순서
        private Integer viewCnt;            // 조회수
        private String useYn;               // 사용여부 Y/N
        private String eventDesc;           // 이벤트설명
        private String regBy;               // 등록자
        private LocalDateTime regDate;      // 등록일
        private String regSiteId;           // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;               // 수정자
        private LocalDateTime updDate;      // 수정일
        // ── 연관정보 (getById / 목록 시 채움) ──
        private List<PmEventItemDto.Item>    eventItems;   // 이벤트 대상상품 목록
        private List<PmEventBenefitDto.Item> benefits;     // 이벤트 혜택 목록
    }

}
