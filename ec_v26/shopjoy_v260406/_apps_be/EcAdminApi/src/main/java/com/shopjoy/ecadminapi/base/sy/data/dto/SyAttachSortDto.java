package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 첨부 파일 정렬 순서 변경 Request DTO.
 * 사용: PATCH /api/co/cm/upload/attach/{attachId}/sort
 */
public class SyAttachSortDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        private Integer sortOrd;
    }
}
