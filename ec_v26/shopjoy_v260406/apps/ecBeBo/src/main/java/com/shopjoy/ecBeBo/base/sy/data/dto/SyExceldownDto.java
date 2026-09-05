package com.shopjoy.ecBeBo.base.sy.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import com.shopjoy.ecBeBo.base.sy.data.dto.AttachFile;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class SyExceldownDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21)  private String siteId;  // 사이트ID 필터
        @Size(max = 21)  private String exceldownId;  // 엑셀다운로드ID 필터
        @Size(max = 50)  private String domainCd;  // 엑셀 도메인 키 필터 (ExcelDomainHandler.key, 예: memberLoginLog)
        @Size(max = 20)  private String runTypeCd;  // 실행유형 필터 (SYNC:즉시다운로드 / ASYNC:예약다운로드)
        @Size(max = 20)  private String exceldownStatusCd;  // 상태 필터 (WAITING/RUNNING/DONE/FAIL/TIMEOUT/CANCELED)
        /** 요청자 필터 — 엑셀다운로드 화면은 "내 정보" 를 기본값으로 넣는다 */
        @Size(max = 30)  private String regBy;  // 요청자(등록자) 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_exceldown ───────────────────────────────────────
        private String exceldownId;  // 엑셀다운로드ID (YYMMDDhhmmss+rand4)
        private String domainCd;  // 엑셀 도메인 키 (ExcelDomainHandler.key, 예: memberLoginLog)
        private String domainNm;  // 도메인 한글명 (예: 회원 로그인 로그)
        private String uiNm;  // 요청 화면명 (X-UI-Nm)
        private String apiUrl;  // 다운로드 실행 backend API 경로 (예: /api/bo/excel/memberLoginLog/excel)
        private String apiMethodCd;  // HTTP 메서드 (GET/POST)
        private String runTypeCd;  // 실행유형 (SYNC:즉시다운로드 / ASYNC:예약다운로드)
        private String exceldownStatusCd;  // 상태 (WAITING:대기열 / RUNNING:진행중 / DONE:완료 / FAIL:실패 / TIMEOUT:시간초과 / CANCELED:강제취소)
        private String searchParamJson;  // 요청 시점 검색조건 스냅샷 (JSON, 재실행·표시용)
        private String searchCondText;  // 검색조건 사람이 읽는 형태 (화면 라벨 기준, 이력 화면 표시용)
        private String excelColumns;  // 다운로드 컬럼 헤더명 (그리드 헤더 순서대로, 쉼표 구분)
        private Integer totalCount;  // 대상 전체 건수 (countList 결과)
        private Integer doneCount;  // 처리 완료 건수 (청크 단위 갱신, 진행률 표시용)
        private String fileNm;  // 대표(첫) 파일명 — 분할 시 1/N 파일
        private Long fileSize;  // 대표(첫) 파일 크기 (byte)
        private Integer fileCount;  // 생성 파일 수 (분할 시 N, 미분할 1)
        private Long totalFileSize;  // 전체 파일 크기 합계 (byte)
        private String attachId;  // 대표(첫) 첨부파일ID — 알림 원클릭 다운로드용
        private Integer downloadCount;  // 다운로드 횟수
        private LocalDateTime lastDownloadDate;  // 최종 다운로드일시
        private LocalDateTime startDate;  // 실행 시작일시
        private LocalDateTime endDate;  // 실행 종료일시
        private Integer elapsedMs;  // 소요시간 (ms)
        private String errorMsg;  // 실패 사유
        private LocalDateTime expireDate;  // 파일 보관 만료일시 (정리 배치 대상)
        private String podId;  // 실행 pod 식별자 (HOSTNAME) — MSA 장애 추적용
        private String cancelBy;  // 강제취소 실행자
        private LocalDateTime cancelDate;  // 강제취소일시
        private String regBy;  // 등록자(요청자)
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ───────────────────────────────────────────────
        /** 요청자명 (sy_user.user_nm) */
        private String regUserNm;  // 요청자명

        // ── 파생(서비스에서 채움) ────────────────────────────────
        /**
         * 생성된 파일 목록 — sy_attach(ref_table_nm='sy_exceldown', ref_id=exceldownId).
         * 분할 저장 시 N건. 배열 컬럼 대신 첨부 ref 로 1:N 을 표현한다.
         */
        private List<AttachFile> attachFiles;  // 생성된 파일 목록
    }

    /**
     * 진행중 정보 — [엑셀] 클릭 시 "지금 무엇이 돌고 있는지" 를 사용자에게 보여주기 위한 응답.
     * 동시 1건 제한에 걸렸을 때 화면이 이 값으로 안내문과 [강제취소] 버튼을 구성한다.
     */
    @Getter @Setter @NoArgsConstructor
    public static class Status {
        /** 현재 실행 가능 여부 (RUNNING 이 없으면 true) */
        private Boolean available;  // 현재 실행 가능 여부
        /** 진행중 건 (없으면 null) */
        private Item running;  // 진행중 건
        /** 대기열 건수 (WAITING) */
        private Integer waitingCount;  // 대기열 건수
        /** 요청 도메인의 대상 건수 — 즉시/예약 분기 판단용 */
        private Long targetCount;  // 요청 도메인의 대상 건수
        /** 즉시 다운로드 허용 상한 (app.excel.sync-max-rows) */
        private Integer syncMaxRows;  // 즉시 다운로드 허용 상한
        /** 분할 기준 행수 (app.excel.split-rows, 0=미분할) */
        private Integer splitRows;  // 분할 기준 행수
        /** 즉시 다운로드 가능 여부 (available && targetCount <= syncMaxRows) */
        private Boolean syncAllowed;  // 즉시 다운로드 가능 여부
    }
}
