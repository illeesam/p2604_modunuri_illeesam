package com.shopjoy.ecadminapi.md.sg.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class MdSgSourcegenDto {

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String sourcegenId;  // 소스젠ID
        private String projectId;    // 프로젝트ID
        private Integer tabNo;       // 탭 번호 (1~10)
        private String ddlText;      // CREATE TABLE 원문 DDL
        private String schemaNm;     // 스키마명
        private String tableNm;      // 테이블명
        private String classNm;      // 생성 클래스명
        private String endpoint;     // REST 엔드포인트 경로
        private String swaggerTag;   // Swagger 태그
        private Integer sortOrd;     // 정렬순서
        private String useYn;        // 사용여부 Y/N
    }
}
