package com.shopjoy.ecBeBo.md.sg.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class MdSgProjectDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;            // 사이트ID 필터
        @Size(max = 21) private String projectId;         // 프로젝트ID 필터
        @Size(max = 21) private String memberId;          // 작성 회원ID 필터 (FO는 본인만, BO는 검색용)
        @Size(max = 20) private String dbTypeCd;          // DB유형 필터
        @Size(max = 20) private String projectStatusCd;   // 상태 필터
        @Size(max = 1)  private String useYn;             // 사용여부 필터 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String projectId;             // 프로젝트ID (YYMMDDhhmmss+rand4)
        private String memberId;              // 작성 회원ID (mb_member.member_id)
        private String projectNm;             // 프로젝트명
        private String projectDesc;           // 프로젝트 설명
        private String basePackage;           // Base Package (전체 DDL 탭 공유)
        private String dbTypeCd;              // DB 유형 — SG_DB_TYPE_CD {POSTGRESQL, ORACLE}
        private String dbTypeCdNm;            // DB 유형 코드명 (화면 표시용)
        private Integer ddlCount;             // 등록된 DDL 탭 수
        private LocalDateTime lastGenDate;    // 마지막 소스 생성 일시
        private Integer lastFileCount;        // 마지막 생성 파일 수
        private String thumbnailUrl;          // 대표이미지 URL (미첨부 시 DDL 정보로 자동 생성)
        private String thumbnailAttachId;     // 대표이미지 첨부ID (sy_attach.attach_id)
        private String projectStatusCd;       // 상태 — SG_PROJECT_STATUS_CD {DRAFT:작성중, DONE:생성완료}
        private String projectStatusCdNm;     // 상태 코드명 (화면 표시용)
        private String useYn;                 // 사용여부 Y/N
        private String memberNm;              // 작성 회원명 (조인, 목록 표시용)
        private Long genHistCount;            // 생성 이력 건수 (서브쿼리)
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
