package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * 상품 설명 블록 일괄 갱신 Request DTO.
 * 사용: PUT /api/bo/ec/pd/prod/{prodId}/contents
 */
public class PdProdContentUpdateDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        private List<Block> contentBlocks;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Block {
        /** html / image / url 등 */
        private String type;
        /** 컨텐츠 본문 (HTML / URL / 파일경로 등) */
        private String content;
        /** 첨부 파일 원본명 */
        private String fileName;
    }
}
