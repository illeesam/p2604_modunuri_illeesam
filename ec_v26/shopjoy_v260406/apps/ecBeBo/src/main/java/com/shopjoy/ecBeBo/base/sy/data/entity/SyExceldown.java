package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "sy_exceldown", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 엑셀 다운로드 요청/이력 엔티티 — 동기(즉시)·비동기(예약) 전부 기록
@Comment("엑셀 다운로드 요청/이력 (동기·비동기 전부 기록)")
public class SyExceldown extends BaseEntity {

    @Id
    @Comment("엑셀다운로드ID (YYMMDDhhmmss+rand4)")
    @Column(name = "exceldown_id", length = 21, nullable = false)
    @Size(max = 21, message = "exceldownId 는 21자 이내여야 합니다.")
    private String exceldownId;

    @Comment("엑셀 도메인 키 (ExcelDomainHandler.key, 예: memberLoginLog)")
    @Column(name = "domain_cd", length = 50, nullable = false)
    @Size(max = 50, message = "domainCd 는 50자 이내여야 합니다.")
    private String domainCd;

    @Comment("도메인 한글명 (예: 회원 로그인 로그)")
    @Column(name = "domain_nm", length = 100)
    @Size(max = 100, message = "domainNm 는 100자 이내여야 합니다.")
    private String domainNm;

    @Comment("요청 화면명 (X-UI-Nm)")
    @Column(name = "ui_nm", length = 100)
    @Size(max = 100, message = "uiNm 는 100자 이내여야 합니다.")
    private String uiNm;

    @Comment("다운로드 실행 backend API 경로 (예: /api/bo/excel/memberLoginLog/excel)")
    @Column(name = "api_url", length = 300)
    @Size(max = 300, message = "apiUrl 는 300자 이내여야 합니다.")
    private String apiUrl;

    @Comment("HTTP 메서드 (GET/POST)")
    @Column(name = "api_method_cd", length = 10)
    @Size(max = 10, message = "apiMethodCd 는 10자 이내여야 합니다.")
    private String apiMethodCd;

    @Comment("실행유형 (SYNC: 즉시다운로드 / ASYNC: 예약다운로드)")
    @Column(name = "run_type_cd", length = 20, nullable = false)
    @Size(max = 20, message = "runTypeCd 는 20자 이내여야 합니다.")
    private String runTypeCd;

    @Comment("상태 (WAITING: 대기열 / RUNNING: 진행중 / DONE: 완료 / FAIL: 실패 / TIMEOUT: 시간초과 / CANCELED: 강제취소)")
    @Column(name = "exceldown_status_cd", length = 20, nullable = false)
    @Size(max = 20, message = "exceldownStatusCd 는 20자 이내여야 합니다.")
    private String exceldownStatusCd;

    @Comment("요청 시점 검색조건 스냅샷 (JSON, 재실행·표시용)")
    @Column(name = "search_param_json", columnDefinition = "TEXT")
    @Size(max = 500000, message = "searchParamJson 는 500,000자 이내여야 합니다.")
    private String searchParamJson;

    @Comment("검색조건 사람이 읽는 형태 (화면 라벨 기준, 이력 화면 표시용)")
    @Column(name = "search_cond_text", columnDefinition = "TEXT")
    @Size(max = 500000, message = "searchCondText 는 500,000자 이내여야 합니다.")
    private String searchCondText;

    @Comment("다운로드 컬럼 헤더명 (그리드 헤더 순서대로, 쉼표 구분)")
    @Column(name = "excel_columns", columnDefinition = "TEXT")
    @Size(max = 500000, message = "excelColumns 는 500,000자 이내여야 합니다.")
    private String excelColumns;

    @Comment("대상 전체 건수 (countList 결과)")
    @Column(name = "total_count")
    private Integer totalCount;

    @Comment("처리 완료 건수 (청크 단위 갱신, 진행률 표시용)")
    @Column(name = "done_count")
    private Integer doneCount;

    @Comment("대표(첫) 파일명 — 분할 시 1/N 파일")
    @Column(name = "file_nm", length = 300)
    @Size(max = 300, message = "fileNm 는 300자 이내여야 합니다.")
    private String fileNm;

    @Comment("대표(첫) 파일 크기 (byte)")
    @Column(name = "file_size")
    private Long fileSize;

    @Comment("생성 파일 수 (분할 시 N, 미분할 1)")
    @Column(name = "file_count")
    private Integer fileCount;

    @Comment("전체 파일 크기 합계 (byte)")
    @Column(name = "total_file_size")
    private Long totalFileSize;

    @Comment("대표(첫) 첨부파일ID — 알림 원클릭 다운로드용. 전체 목록은 sy_attach(ref_table_nm=sy_exceldown, ref_id=exceldown_id) 로 조회")
    @Column(name = "attach_id", length = 21)
    @Size(max = 21, message = "attachId 는 21자 이내여야 합니다.")
    private String attachId;

    @Comment("다운로드 횟수")
    @Column(name = "download_count")
    private Integer downloadCount;

    @Comment("최종 다운로드일시")
    @Column(name = "last_download_date")
    private LocalDateTime lastDownloadDate;

    @Comment("실행 시작일시")
    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Comment("실행 종료일시")
    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Comment("소요시간 (ms)")
    @Column(name = "elapsed_ms")
    private Integer elapsedMs;

    @Comment("실패 사유")
    @Column(name = "error_msg", columnDefinition = "TEXT")
    @Size(max = 500000, message = "errorMsg 는 500,000자 이내여야 합니다.")
    private String errorMsg;

    @Comment("파일 보관 만료일시 (정리 배치 대상)")
    @Column(name = "expire_date")
    private LocalDateTime expireDate;

    @Comment("실행 pod 식별자 (HOSTNAME) — MSA 장애 추적용")
    @Column(name = "pod_id", length = 100)
    @Size(max = 100, message = "podId 는 100자 이내여야 합니다.")
    private String podId;

    @Comment("강제취소 실행자")
    @Column(name = "cancel_by", length = 30)
    @Size(max = 30, message = "cancelBy 는 30자 이내여야 합니다.")
    private String cancelBy;

    @Comment("강제취소일시")
    @Column(name = "cancel_date")
    private LocalDateTime cancelDate;
}
