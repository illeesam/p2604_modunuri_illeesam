package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class CmPathDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 1) private String useYn;  // 사용여부 Y/N 필터
        @Size(max = 21) private String bizCd;  // 업무코드 필터 (참조 테이블명, 예: sy_brand / sy_code_grp / ec_prop)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String bizCd;  // 업무코드 (참조 테이블명, 예: sy_brand / sy_code_grp / ec_prop)
        private Long parentPathId;  // 부모 경로ID (sy_path., 루트는 NULL)
        private String pathLabel;  // 경로 라벨 (한글 표시명)
        private Integer sortOrd;  // 동일 부모 내 정렬순서
        private String useYn;  // 사용여부 Y/N
        private String pathRemark;  // 비고
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
    }

}
