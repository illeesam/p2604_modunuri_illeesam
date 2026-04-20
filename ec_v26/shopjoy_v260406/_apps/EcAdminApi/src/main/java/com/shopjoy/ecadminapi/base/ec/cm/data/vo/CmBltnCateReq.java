package com.shopjoy.ecadminapi.base.ec.cm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltnCate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmBltnCateReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String blogCateId;

    @NotBlank(message = "사이트ID는 필수입니다.")
    private String siteId;

    @Size(max = 100, message = "카테고리명은 100자 이내로 입력해주세요.")
    private String blogCateNm;
    private String parentBlogCateId;
    private Integer sortOrd;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public CmBltnCate toEntity() {
        return CmBltnCate.builder()
                .blogCateId(blogCateId)
                .siteId(siteId)
                .blogCateNm(blogCateNm)
                .parentBlogCateId(parentBlogCateId)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
