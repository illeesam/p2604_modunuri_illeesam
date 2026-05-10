package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * 상품 이미지 일괄 갱신 Request DTO.
 * 사용: PUT /api/bo/ec/pd/prod/{prodId}/images
 */
public class PdProdImgUpdateDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        /** 이미지 행 목록 */
        private List<Row> images;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Row {
        private String optItemId1;
        private String optItemId2;
        /** 새 업로드 이미지 URL (또는 Base64) */
        private String previewUrl;
        private String cdnThumbUrl;
        private String imgAltText;
        /** 대표 이미지 여부 */
        private Boolean isMain;
    }
}
