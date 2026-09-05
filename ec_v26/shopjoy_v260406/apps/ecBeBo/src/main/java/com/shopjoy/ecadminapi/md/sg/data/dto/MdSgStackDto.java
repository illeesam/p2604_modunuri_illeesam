package com.shopjoy.ecadminapi.md.sg.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class MdSgStackDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;        // 사이트ID 필터
        @Size(max = 20) private String categoryCd;     // 구획 필터
        @Size(max = 1)  private String useYn;          // 사용여부 필터 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String stackId;         // 스택ID (YYMMDDhhmmss+rand4)
        private String categoryCd;      // 구획 — SG_STACK_CATEGORY_CD {BACKEND, FRONTEND, FULLSTACK, MOBILE, ETC}
        private String stackNm;         // 화면 표시명
        private String stackPrefix;     // 생성 파일 경로 접두어 (gnGenerate 결과 키와 정확히 일치)
        private String versionList;     // 선택 가능 버전 목록 (콤마 구분)
        private String defaultVersion;  // 기본 선택 버전
        private Integer sortOrd;        // 구획 내 정렬순서
        private String useYn;           // 사용여부 Y/N
        private String regBy;           // 등록자
        private LocalDateTime regDate;  // 등록일
        private String siteId;          // 사이트ID
        private String updBy;           // 수정자
        private LocalDateTime updDate;  // 수정일
    }
}
