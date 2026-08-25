package com.shopjoy.ecadminapi.md.sg.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class MdSgDownloadHistDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;     // 사이트ID 필터
        @Size(max = 21) private String projectId;  // 프로젝트ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String downloadHistId;   // 다운로드이력ID
        private String projectId;        // 프로젝트ID (저장 전 다운로드는 NULL)
        private String projectNm;        // 프로젝트명 스냅샷
        private String basePackage;      // Base Package 스냅샷
        private String zipFileNm;        // ZIP 파일명 스냅샷
        private Integer ddlCount;        // DDL 탭 수
        private Integer fileCount;       // 생성 파일 수
        private String regBy;            // 등록자 (다운로드한 FO 회원ID)
        private LocalDateTime regDate;   // 등록일 (=다운로드 일시)
        private String memberNm;         // 다운로드한 회원명 (조인)
        private String siteId;           // 사이트ID
    }
}
