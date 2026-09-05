package com.shopjoy.ecBeBo.base.sy.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyAttachDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String attachId;  // 첨부파일ID 필터
        @Size(max = 50) private String mimeTypeCd;  // MIME 타입 필터
        @Size(max = 100) private String refTableNm;  // 관련 테이블명 필터 (예: sy_notice)
        @Size(max = 21) private String refId;  // 관련 ID 필터
    }

    /**
     * 첨부 축약 항목 — 다른 도메인 DTO 가 첨부 목록을 물고 갈 때 쓰는 <b>공통</b> 투영.
     *
     * <p>화면이 파일을 띄우는 데 필요한 것만 담는다({@link Item} 27필드는 첨부관리 화면 전용).
     * 도메인마다 6~7필드짜리 첨부 클래스를 각자 만들면 같은 {@code sy_attach} 컬럼을
     * 도메인마다 다른 이름으로 부르게 되어(attachNm vs fileNm …) 프론트가 화면마다
     * 다른 키를 써야 한다. 그래서 <b>필드명은 sy_attach 컬럼 그대로</b> 둔다.</p>
     *
     * <p>사용: {@code private List<SyAttachDto.Brief> attachFiles;}</p>
     */
    @Getter @Setter @NoArgsConstructor
    public static class Brief {
        private String  attachId;  // 첨부파일ID
        private String  fileNm;  // 원본 파일명
        private String  fileExt;  // 파일 확장자
        private Long    fileSize;  // 파일 크기
        private String  attachUrl;  // 첨부파일 URL
        private String  thumbUrl;  // 썸네일 URL
        /* URL 폴백용 — attach_url 은 실제로 비어 있는 행이 많고(404건 중 20건만 채워짐)
           storage_path 는 항상 있다. 화면은 cdnImgUrl → attachUrl → storagePath 순으로 고른다
           (BaseAttachGrp 가 쓰는 규약과 동일). */
        private String  cdnImgUrl;  // CDN 이미지 URL
        private String  thumbCdnUrl;  // CDN 썸네일 URL
        private String  storagePath;  // 파일 저장 경로
        private Integer sortOrd;  // 정렬 순서
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_attach ──────────────────────────────────────────
        private String attachId;  // 첨부파일 ID (YYMMDDhhmmss+random(4)+seq)
        private String refTableNm;  // 관련 테이블명 (예: sy_notice) - 대상 엔티티에 직접 연계
        private String refId;  // 관련 ID - ref_table_nm 과 조합해 대상 레코드를 식별
        private String fileNm;  // 원본 파일명
        private Long fileSize;  // 파일 크기
        private String fileExt;  // 파일 확장자
        private String mimeTypeCd;  // MIME 타입
        private String storedNm;  // 저장된 파일명 (YYYYMMDD_hhmmss_seq_random.ext)
        private String attachUrl;  // 첨부파일 URL
        private String storagePath;  // 파일 저장 경로 (정책: /cdn/{업무명}/YYYY/YYYYMM/YYYYMMDD/{파일명})
        private String physicalPath;  // 실제 물리 저장 전체 경로 (서버 절대경로)
        private String cdnHost;  // CDN 호스트
        private String cdnImgUrl;  // CDN 이미지 URL
        private String cdnThumbUrl;  // CDN 썸네일 URL
        private String thumbFileNm;  // 썸네일 파일명
        private String thumbStoredNm;  // 썸네일 저장 파일명
        private String thumbUrl;  // 썸네일 URL
        private String thumbCdnUrl;  // 썸네일 CDN URL
        private String thumbGeneratedYn;  // 썸네일 생성 여부 (동영상은 필수 Y, 이미지는 선택) Y/N
        private Integer sortOrd;  // 정렬 순서
        private String attachMemo;  // 첨부 메모
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────
    }

}
