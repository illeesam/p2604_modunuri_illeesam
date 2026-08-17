package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyI18nDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String i18nId;  // 다국어ID 필터
        @Size(max = 100) private String i18nKey;  // 다국어 키 필터 (예: common.bt.save, error.FORBIDDEN)
        @Size(max = 50) private String i18nScopeCd;  // 적용범위 필터 — I18N_SCOPE_CD {FO:프론트, BO:관리자, COMMON:공통}
        @Size(max = 50) private String i18nCategory;  // 키 첫 세그먼트 필터 (common/error/link/paging 등)
        @Size(max = 1)  private String useYn;  // 사용여부 필터 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_i18n ──────────────────────────────────────────
        private String i18nId;  // 다국어ID (YYMMDDhhmmss+rand4)
        private String i18nKey;  // 다국어 키 (예: common.bt.save, error.FORBIDDEN)
        private String i18nDesc;  // 키 설명 (번역자 참고용)
        private String i18nScopeCd;  // 적용범위 — I18N_SCOPE_CD {FO:프론트, BO:관리자, COMMON:공통}
        private String i18nCategory;  // 키 첫 세그먼트 (common/error/link/paging 등)
        /* 언어별 메시지 (2026-08-13 sy_i18n_msg 통합) — ko/en/cn/ja 4종 고정 */
        private String i18nMsgKo;  // 한국어 메시지 (플레이스홀더 {0},{1} 지원)
        private String i18nMsgEn;  // 영어 메시지 (플레이스홀더 {0},{1} 지원)
        private String i18nMsgCn;  // 중국어 메시지 (플레이스홀더 {0},{1} 지원)
        private String i18nMsgJa;  // 일본어 메시지 (플레이스홀더 {0},{1} 지원)
        private Integer sortOrd;  // 정렬순서
        private String useYn;  // 사용여부 Y/N
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────
    }

}
