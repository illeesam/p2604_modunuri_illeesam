package com.shopjoy.ecadminapi.md.sg.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class MdSgSourcegenHistDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;      // 사이트ID 필터
        @Size(max = 21) private String projectId;   // 소스젠ID 필터 (특정 소스젠의 이력만)
        @Size(max = 1)  private String useYn;       // 사용여부 필터 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String sourcegenHistId;      // 소스젠 생성이력ID
        private String projectId;      // 프로젝트ID
        private LocalDateTime genDate; // 생성 일시
        private Integer ddlCount;      // 포함된 DDL 탭 수
        private Integer fileCount;     // 생성된 소스 파일 수
        private String attachId;       // ZIP 첨부ID (sy_attach.attach_id)
        private String zipFileNm;      // ZIP 파일명
        private Long zipFileSize;      // ZIP 파일 크기(byte)
        private String zipUrl;         // ZIP 다운로드 URL
        private String genMemo;        // 생성 메모
        private String selectedStacks; // 선택된 언어/스택 라벨 목록(콤마 구분)
        private Integer downloadCount; // 다운로드 횟수(2026-08-30)
        private String ddlSnapshotJson; // DDL 탭 스냅샷(JSON) — [불러오기] 복원용
        private String useYn;          // 사용여부 Y/N
        private String projectNm;      // 소스젠명 (조인, 이력 목록 표시용)
        private String basePackage;    // Base Package (조인)
        private String regBy;          // 등록자
        private LocalDateTime regDate; // 등록일
        private String regUserNm;      // 등록자명 (조인)
        private String memberNm;       // 작성 회원명 (조인)
    }
}
