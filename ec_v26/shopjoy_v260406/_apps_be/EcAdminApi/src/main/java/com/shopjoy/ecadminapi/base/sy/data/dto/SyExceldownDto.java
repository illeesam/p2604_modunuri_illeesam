package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import com.shopjoy.ecadminapi.base.sy.data.dto.AttachFile;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class SyExceldownDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21)  private String siteId;
        @Size(max = 21)  private String exceldownId;
        @Size(max = 50)  private String domainCd;
        @Size(max = 20)  private String runTypeCd;
        @Size(max = 20)  private String exceldownStatusCd;
        /** 요청자 필터 — 엑셀다운로드 화면은 "내 정보" 를 기본값으로 넣는다 */
        @Size(max = 30)  private String regBy;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_exceldown ───────────────────────────────────────
        private String exceldownId;
        private String domainCd;
        private String domainNm;
        private String uiNm;
        private String apiUrl;
        private String apiMethodCd;
        private String runTypeCd;
        private String exceldownStatusCd;
        private String searchParamJson;
        private Integer totalCount;
        private Integer doneCount;
        private String fileNm;
        private Long fileSize;
        private Integer fileCount;
        private Long totalFileSize;
        private String attachId;
        private Integer downloadCount;
        private LocalDateTime lastDownloadDate;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private Integer elapsedMs;
        private String errorMsg;
        private LocalDateTime expireDate;
        private String podId;
        private String cancelBy;
        private LocalDateTime cancelDate;
        private String regBy;
        private LocalDateTime regDate;
        private String regSiteId;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ───────────────────────────────────────────────
        /** 요청자명 (sy_user.user_nm) */
        private String regUserNm;

        // ── 파생(서비스에서 채움) ────────────────────────────────
        /**
         * 생성된 파일 목록 — sy_attach(ref_table_nm='sy_exceldown', ref_id=exceldownId).
         * 분할 저장 시 N건. 배열 컬럼 대신 첨부 ref 로 1:N 을 표현한다.
         */
        private List<AttachFile> attachFiles;
    }

    /**
     * 진행중 정보 — [엑셀] 클릭 시 "지금 무엇이 돌고 있는지" 를 사용자에게 보여주기 위한 응답.
     * 동시 1건 제한에 걸렸을 때 화면이 이 값으로 안내문과 [강제취소] 버튼을 구성한다.
     */
    @Getter @Setter @NoArgsConstructor
    public static class Status {
        /** 현재 실행 가능 여부 (RUNNING 이 없으면 true) */
        private Boolean available;
        /** 진행중 건 (없으면 null) */
        private Item running;
        /** 대기열 건수 (WAITING) */
        private Integer waitingCount;
        /** 요청 도메인의 대상 건수 — 즉시/예약 분기 판단용 */
        private Long targetCount;
        /** 즉시 다운로드 허용 상한 (app.excel.sync-max-rows) */
        private Integer syncMaxRows;
        /** 분할 기준 행수 (app.excel.split-rows, 0=미분할) */
        private Integer splitRows;
        /** 즉시 다운로드 가능 여부 (available && targetCount <= syncMaxRows) */
        private Boolean syncAllowed;
    }
}
