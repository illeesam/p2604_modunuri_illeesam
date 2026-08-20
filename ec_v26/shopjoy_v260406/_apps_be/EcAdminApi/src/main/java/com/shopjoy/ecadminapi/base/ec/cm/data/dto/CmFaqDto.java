package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class CmFaqDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 (도메인 전용 검색조건) ────────────────────────
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String faqId;  // FAQ ID 필터
        @Size(max = 21) private String pathId;   // 선택 노드 (하위 트리 포함 조회)
        @Size(max = 1)  private String useYn;  // 노출여부 Y/N 필터
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── cm_faq ────────────────────────────────────────────────
        private String faqId;  // FAQ ID
        private String pathId;  // FAQ 분류 표시경로 (sy_path.path_id, biz_cd=cm_faq)
        private String faqQuestion;  // 질문
        private String faqAnswer;  // 답변(HTML)
        private Integer sortOrd;  // 정렬순서
        private String useYn;  // 노출여부 Y/N
        private Integer viewCount;  // 조회수
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────────
        private String siteNm;  // 사이트명 (조인)
        private String pathLabel;   // sy_path.path_label (분류 표시명)
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
}
