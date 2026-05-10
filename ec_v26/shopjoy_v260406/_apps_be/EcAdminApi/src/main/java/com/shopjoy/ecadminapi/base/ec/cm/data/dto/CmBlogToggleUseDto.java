package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * CmBlog useYn 토글 요청 DTO.
 * 사용: PUT /api/bo/ec/cm/blog/{id}/use
 */
public class CmBlogToggleUseDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        @Size(max = 1) private String useYn;
    }
}
