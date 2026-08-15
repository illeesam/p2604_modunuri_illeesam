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
        private String prodOpt1Id;
        private String prodOpt2Id;
        /** 업로드된 CDN 이미지 URL (coApiSvc.cmUpload 업로드 결과) 또는 직접 입력 URL */
        private String previewUrl;
        private String cdnThumbUrl;
        private String imgAltText;
        /** 대표 이미지 여부 */
        private Boolean isMain;
        /** 첨부파일ID (sy_attach.attach_id) — coApiSvc.cmUpload 업로드 결과. 직접 입력 URL(+URL 입력)이면 null */
        private String attachId;
    }
}
