package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
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
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String faqId;
        @Size(max = 21) private String pathId;   // 선택 노드 (하위 트리 포함 조회)
        @Size(max = 1)  private String useYn;
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── cm_faq ────────────────────────────────────────────────
        private String faqId;
        private String siteId;
        private String pathId;
        private String faqQuestion;
        private String faqAnswer;
        private String answerAttachGrpId;
        private Integer sortOrd;
        private String useYn;
        private Integer viewCount;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────────
        private String siteNm;
        private String pathLabel;   // sy_path.path_label (분류 표시명)
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
