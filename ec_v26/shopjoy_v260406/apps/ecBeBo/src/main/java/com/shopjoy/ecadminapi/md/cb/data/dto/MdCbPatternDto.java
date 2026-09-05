package com.shopjoy.ecadminapi.md.cb.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class MdCbPatternDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;           // 사이트ID 필터
        @Size(max = 21) private String patternId;        // 도안ID 필터
        @Size(max = 21) private String memberId;         // 작성 회원ID 필터 (FO는 본인만, BO는 검색용)
        @Size(max = 20) private String patternStatusCd;  // 상태 필터
        @Size(max = 1)  private String useYn;            // 사용여부 필터 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String patternId;             // 도안ID (YYMMDDhhmmss+rand4)
        private String memberId;              // 작성 회원ID (mb_member.member_id)
        private String patternNm;             // 도안명
        private String patternDesc;           // 도안 설명
        private Integer rowCount;             // 총 단수
        private Integer maxStitchCount;       // 최대 코수
        private String descText;              // 한글 도안 설명 (자동생성 캐시)
        private String roundDescText;         // 원형(라운드) 도안 입력 텍스트
        private Long distinctColorCount;      // 격자 셀에 쓰인 서로 다른 배색 수(color_hex distinct) — 목록에서 기호/배색 도안 구분용
        private String thumbnailUrl;          // 썸네일 이미지 URL
        private String patternStatusCd;       // 상태 — CB_PATTERN_STATUS_CD {DRAFT:작성중, PUBLISHED:공개, PRIVATE:비공개}
        private String patternStatusCdNm;     // 상태 코드명 (화면 표시용)
        private String useYn;                 // 사용여부 Y/N
        private String memberNm;              // 작성 회원명 (조인, BO 목록 표시용)
        private String regBy;                 // 등록자
        private LocalDateTime regDate;        // 등록일
        private String regSiteId;             // 등록 사이트ID
        private String siteId;                // 사이트ID
        private String siteNm;                // 사이트명 (조인)
        private String regSiteNm;             // 등록사이트명 (조인)
        private String regUserNm;             // 등록자명 (조인)
        private String updBy;                 // 수정자
        private LocalDateTime updDate;        // 수정일
    }
}
