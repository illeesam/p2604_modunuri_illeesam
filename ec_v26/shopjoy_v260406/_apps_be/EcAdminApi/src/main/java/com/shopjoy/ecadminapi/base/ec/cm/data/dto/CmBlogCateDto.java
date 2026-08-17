package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class CmBlogCateDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 1) private String useYn;  // 사용여부 Y/N 필터
        @Size(max = 21) private String blogCateId;  // 블로그카테고리ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String blogCateId;  // 블로그카테고리ID
        private String blogCateNm;  // 카테고리명
        private String parentBlogCateId;  // 상위 카테고리ID (NULL이면 최상위)
        private Integer sortOrd;  // 정렬순서
        private String useYn;  // 사용여부 Y/N
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        private String siteNm;  // 사이트명 (조인)
        private Long blogCnt;   // 카테고리별 블로그 글 수 (FO 사이드바 count, 서비스에서 채움)
    }

}
