package com.shopjoy.ecBeBo.base.zz.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class ZzExam1Dto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        private List<String> exam1Ids;                 // PK 다건 IN
        @Size(max = 20)  private String exam1Id;       // PK 정확일치
        @Size(max = 20)  private String exam1IdLike;   // PK 부분검색
        @Size(max = 200) private String col11;  // 예제 범용 컬럼11 검색값
        @Size(max = 200) private String col12;  // 예제 범용 컬럼12 검색값
        @Size(max = 200) private String col13;  // 예제 범용 컬럼13 검색값
        @Size(max = 200) private String col14;  // 예제 범용 컬럼14 검색값
        @Size(max = 200) private String col15;  // 예제 범용 컬럼15 검색값
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String exam1Id;  // 예제(exam1) ID
        private String col11;  // 예제 범용 컬럼11
        private String col12;  // 예제 범용 컬럼12
        private String col13;  // 예제 범용 컬럼13
        private String col14;  // 예제 범용 컬럼14
        private String col15;  // 예제 범용 컬럼15
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        // ── 하위 계층 연관정보 (getById 시 채움) ──
        private List<ZzExam2Dto.Item> exam2s;   // 하위 exam2 목록
        private List<ZzExam3Dto.Item> exam3s;   // 하위 exam3 목록
    }

}
