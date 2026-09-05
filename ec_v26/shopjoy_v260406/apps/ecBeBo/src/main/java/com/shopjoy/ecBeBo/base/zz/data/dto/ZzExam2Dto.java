package com.shopjoy.ecBeBo.base.zz.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class ZzExam2Dto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        private List<String> exam1Ids;                 // PK 다건 IN
        @Size(max = 20)  private String exam1Id;       // PK 정확일치
        @Size(max = 20)  private String exam2Id;       // PK 정확일치
        @Size(max = 20)  private String exam1IdLike;   // PK 부분검색
        @Size(max = 20)  private String exam2IdLike;   // PK 부분검색
        @Size(max = 200) private String col21;  // 예제 범용 컬럼21 검색값
        @Size(max = 200) private String col22;  // 예제 범용 컬럼22 검색값
        @Size(max = 200) private String col23;  // 예제 범용 컬럼23 검색값
        @Size(max = 200) private String col24;  // 예제 범용 컬럼24 검색값
        @Size(max = 200) private String col25;  // 예제 범용 컬럼25 검색값
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String exam1Id;  // 상위 exam1 ID (복합 PK)
        private String exam2Id;  // 예제(exam2) ID (복합 PK)
        private String col21;  // 예제 범용 컬럼21
        private String col22;  // 예제 범용 컬럼22
        private String col23;  // 예제 범용 컬럼23
        private String col24;  // 예제 범용 컬럼24
        private String col25;  // 예제 범용 컬럼25
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        // ── 계층 연관정보 (getById 시 채움) ──
        private ZzExam1Dto.Item       exam1;    // 상위 exam1 단건
        private List<ZzExam3Dto.Item> exam3s;   // 하위 exam3 목록
    }

}
