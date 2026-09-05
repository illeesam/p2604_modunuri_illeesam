package com.shopjoy.ecBeBo.base.sy.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyTemplateDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 검색값
        @Size(max = 21) private String templateId;  // 템플릿ID 검색값
        @Size(max = 50) private String templateTypeCd;  // 템플릿유형 검색값 — TEMPLATE_TYPE_CD {EMAIL:이메일, SMS:SMS, KAKAO:알림톡, PUSH:푸시, MAIL:메일}
        @Size(max = 50) private String templateCode;  // 템플릿코드 검색값
        @Size(max = 21) private String pathId;  // 표시경로ID 검색값
        @Size(max = 1)  private String useYn;  // 사용여부 검색값 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_template ──────────────────────────────────────────
        private String templateId;  // 템플릿ID (YYMMDDhhmmss+rand4)
        private String templateTypeCd;  // 템플릿유형 — TEMPLATE_TYPE_CD {EMAIL:이메일, SMS:SMS, KAKAO:알림톡, PUSH:푸시, MAIL:메일}
        private String templateCode;  // 템플릿코드
        private String templateNm;  // 템플릿명
        private String templateSubject;  // 제목 (이메일용)
        private String templateContent;  // 내용 (치환변수 포함)
        private String sampleParams;  // 치환변수 예시 (JSON)
        private String useYn;  // 사용여부 Y/N
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        private String pathId;  // 점(.) 구분 표시경로 (트리 빌드용)

        // ── JOIN ──────────────────────────────────────────────
    }

}
