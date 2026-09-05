package com.shopjoy.ecBeBo.base.sy.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyCodeDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String codeId;  // 코드ID 필터
        @Size(max = 50) private String codeGrp;  // 코드그룹코드 필터 (예: MEMBER_GRADE) — sy_code_grp.code_grp
        /* 코드그룹 다중 조회 — 화면이 필요한 그룹을 한 번에 받는다(지연 로딩 배치).
           codeGrp(단일)과 함께 오면 둘 다 AND 로 걸리므로 보통 하나만 쓴다. */
        private java.util.List<String> codeGrps;  // 코드그룹코드 다중 필터 (지연 로딩 배치 조회용)
        @Size(max = 50) private String codeValue;  // 코드값 필터 (sy_code.code_value)
        @Size(max = 50) private String parentCodeValue;  // 부모 코드값 필터
        @Size(max = 1)  private String useYn;  // 사용여부 필터 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_code ──────────────────────────────────────────
        private String codeId;  // 코드ID (YYMMDDhhmmss+rand4)
        private String codeGrpId;  // FK → sy_code_grp.code_grp_id
        private String codeGrp;    // JOIN from sy_code_grp.code_grp (읽기 전용)
        private String codeValue;  // 코드값 자체 (저장값, sy_code.code_value)
        private String codeLabel;  // 코드라벨 (화면 표시명, sy_code.code_label)
        private Integer sortOrd;  // 정렬순서
        private String useYn;  // 사용여부 Y/N
        private String parentCodeValue;  // 부모 코드값 (트리 구조 시 상위 code_value, null이면 루트)
        private String childCodeValues;  // 허용 자식/전이 코드값 목록 (^VAL1^VAL2^ 형식 — 상태 전이 제약이나 하위 코드 목록)
        private String codeRemark;  // 비고
        private Integer codeLevel;  // 코드 트리 레벨 (1=루트, 2=중간, 3=리프 등)
        private String codeOpt1;  // 코드별 부가 옵션 1 (스타일 색상 hex, 아이콘 클래스 등 자유 문자열)
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────
        private String grpNm;  // 코드그룹명
    }

}
