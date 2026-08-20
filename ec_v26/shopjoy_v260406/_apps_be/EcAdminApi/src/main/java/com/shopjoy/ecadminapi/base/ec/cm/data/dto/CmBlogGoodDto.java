package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class CmBlogGoodDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String blogGoodId;  // 좋아요ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String blogGoodId;  // 좋아요ID
        private String blogId;  // 블로그ID (cm_blog.blog_id)
        private String userId;  // 사용자ID (sy_member.user_id)
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
    }

}
