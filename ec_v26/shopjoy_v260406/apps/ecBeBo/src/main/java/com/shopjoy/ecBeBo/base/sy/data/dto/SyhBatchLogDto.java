package com.shopjoy.ecBeBo.base.sy.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyhBatchLogDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 (도메인 전용 검색조건) ────────────────────────
        @Size(max = 21) private String siteId;  // 사이트ID
        @Size(max = 21) private String batchLogId;  // 로그ID (YYMMDDhhmmss+rand4)
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── syh_batch_log ──────────────────────────────────────────
        private String batchLogId;  // 로그ID (YYMMDDhhmmss+rand4)
        private String batchId;  // 배치ID
        private String batchCode;  // 배치코드
        private String batchNm;  // 배치명
        private LocalDateTime runAt;  // 실행시작일시
        private LocalDateTime endAt;  // 실행종료일시
        private Integer durationMs;  // 실행시간(ms)
        private String runStatusCd;  // 실행결과 (코드: BATCH_STATUS — SUCCESS/FAILED/TIMEOUT)
        private Integer procCount;  // 처리건수
        private Integer errorCount;  // 오류건수
        private String message;  // 결과메시지
        private String detail;  // 상세로그 (JSON)
        private String regBy;  // 등록자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────────
        private String runStatusCdNm;  // 실행상태명 (조인)
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
}
