package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class SyNoticeDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID
        @Size(max = 21) private String noticeId;  // 공지ID (YYMMDDhhmmss+rand4)
        @Size(max = 50) private String noticeTypeCd;  // 공지유형 (코드: NOTICE_TYPE)
        @Size(max = 20) private String status;  // 상태
        @Size(max = 1)  private String isFixed;  // 상단고정 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_notice ──────────────────────────────────────────
        private String noticeId;  // 공지ID (YYMMDDhhmmss+rand4)
        private String noticeTitle;  // 제목
        private String noticeTypeCd;  // 공지유형 (코드: NOTICE_TYPE)
        private String isFixed;  // 상단고정 Y/N
        private String contentHtml;  // 내용 (HTML)
        private LocalDate startDate;  // 노출시작일
        private LocalDate endDate;  // 노출종료일
        private String noticeStatusCd;  // 상태 (ACTIVE/INACTIVE)
        private Integer viewCount;  // 조회수
        private String regBy;  // 등록자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────
    }

}
