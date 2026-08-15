package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 첨부파일 1건 — 부모 레코드 저장(create/update) 요청/응답 바디의 {@code attachFiles}
 * (2번째 슬롯은 {@code attach2Files}) 필드를 요청·응답 양방향에서 공유한다.
 *
 * <p><b>요청 시</b>: 프론트는 {@code attachId}/{@code rowStatus} 둘만 채워 보낸다.
 * rowStatus: I(연계 반영) / D(연계 삭제, 물리 삭제 포함). U(부가정보 수정)는 추후 지원 예정.
 * 나머지 필드는 요청에서는 무시된다.</p>
 *
 * <p><b>응답 시</b>: 업무 Service 가 {@code SyAttachService#applyChanges} 로 연계를 반영한 직후,
 * 같은 필드를 {@code SyAttachService#getAttachFilesByRef} 로 다시 채워(그 시점의 전체 첨부 목록)
 * 돌려준다 — attachId 외 나머지 필드(fileNm/fileExt/fileSize/attachUrl/thumbUrl/cdnImgUrl/
 * thumbCdnUrl/storagePath/sortOrd, sy_attach 컬럼 그대로)가 항상 채워져 있어, 화면이나
 * 메일/카카오 알림톡 발송처럼 첨부 리소스 정보가 바로 필요한 후속 로직이 attachId 로 다시
 * 조회하지 않고 그대로 쓸 수 있다. 이때 rowStatus 는 의미 없어 null.</p>
 */
@Getter @Setter @NoArgsConstructor
public class AttachFile {
    private String attachId;
    private String rowStatus; /** 요청 전용 — I(연계) / D(연계 삭제). 응답에서는 null. */
    private String refTableNm;
    private String refId;

    /* 아래는 응답 전용 — sy_attach 컬럼 그대로. 요청에서는 무시된다. */
    private String fileNm;
    private String fileExt;
    private Long fileSize;
    private String attachUrl;
    private String thumbUrl;
    private String cdnImgUrl;
    private String thumbCdnUrl;
    private String storagePath;
    private Integer sortOrd;
}
