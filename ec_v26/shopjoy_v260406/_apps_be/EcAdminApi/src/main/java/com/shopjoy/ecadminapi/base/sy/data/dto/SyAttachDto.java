package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyAttachDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String attachId;
        @Size(max = 21) private String attachGrpId;
        @Size(max = 50) private String mimeTypeCd;
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
        private String  attachId;
        private String  attachGrpId;
        private String  fileNm;
        private String  fileExt;
        private Long    fileSize;
        private String  attachUrl;
        private String  thumbUrl;
        /* URL 폴백용 — attach_url 은 실제로 비어 있는 행이 많고(404건 중 20건만 채워짐)
           storage_path 는 항상 있다. 화면은 cdnImgUrl → attachUrl → storagePath 순으로 고른다
           (BaseAttachGrp 가 쓰는 규약과 동일). */
        private String  cdnImgUrl;
        private String  thumbCdnUrl;
        private String  storagePath;
        private Integer sortOrd;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_attach ──────────────────────────────────────────
        private String attachId;
        private String siteId;
        private String attachGrpId;
        private String fileNm;
        private Long fileSize;
        private String fileExt;
        private String mimeTypeCd;
        private String storedNm;
        private String attachUrl;
        private String storagePath;
        private String physicalPath;
        private String cdnHost;
        private String cdnImgUrl;
        private String cdnThumbUrl;
        private String thumbFileNm;
        private String thumbStoredNm;
        private String thumbUrl;
        private String thumbCdnUrl;
        private String thumbGeneratedYn;
        private Integer sortOrd;
        private String attachMemo;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────
        private String siteNm;
    }

}
