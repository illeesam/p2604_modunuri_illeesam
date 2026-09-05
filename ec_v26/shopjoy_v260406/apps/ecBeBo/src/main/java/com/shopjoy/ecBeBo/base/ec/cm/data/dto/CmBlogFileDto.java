package com.shopjoy.ecBeBo.base.ec.cm.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class CmBlogFileDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String blogFileId;  // 블로그이미지ID 필터
        @Size(max = 21) private String blogId;          // 상위 FK 필터
        private List<String> blogIds;                  // 상위 FK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String blogFileId;  // 블로그이미지ID
        private String blogId;  // 블로그ID (cm_blog.blog_id)
        private String imgUrl;  // 원본 이미지 URL
        private String thumbUrl;  // 썸네일 이미지 URL
        private String imgAltText;  // 이미지 대체텍스트
        private Integer sortOrd;  // 정렬순서
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
    }

}
