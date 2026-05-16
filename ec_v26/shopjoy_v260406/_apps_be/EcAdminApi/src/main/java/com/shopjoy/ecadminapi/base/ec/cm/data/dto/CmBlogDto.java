package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class CmBlogDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String blogId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String blogId;
        private String siteId;
        private String blogCateId;
        private String blogTitle;
        private String blogSummary;
        private String blogContent;
        private String blogAuthor;
        private String prodId;
        private Integer viewCount;
        private String useYn;
        private String isNotice;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        // ── 연관정보 (getById / 목록 시 채움) ──
        private List<CmBlogReplyDto.Item> replies;   // 댓글 목록
        private List<CmBlogFileDto.Item>  files;     // 첨부 목록
        private List<CmBlogTagDto.Item>   tags;      // 태그 목록
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
