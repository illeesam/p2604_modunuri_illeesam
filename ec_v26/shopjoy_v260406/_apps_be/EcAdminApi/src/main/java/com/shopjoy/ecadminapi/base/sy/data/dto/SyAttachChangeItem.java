package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 첨부파일 연계 변경 1건 — 부모 레코드 저장(create/update) 요청 바디에 attachChanges 로 함께 실려온다.
 * rowStatus: I(연계 반영) / D(연계 삭제, 물리 삭제 포함). U(부가정보 수정)는 추후 지원 예정.
 *
 * <p>fileSize/fileExt/storagePath/refTableNm/refId 는 요청(프론트) 에서는 채워지지 않고,
 * {@code SyAttachService#applyChanges} 가 rowStatus 'I' 항목을 반영한 뒤 sy_attach 의 실제 값으로
 * 채워 응답/후속 처리에 되돌려준다 — 메일/카카오 알림톡 발송 등 첨부 리소스 정보가 바로 필요한
 * 후속 로직이 attachId 로 다시 조회하지 않고 이 값을 그대로 사용할 수 있게 하기 위함이다.</p>
 */
@Getter @Setter @NoArgsConstructor
public class SyAttachChangeItem {
    private String attachId;
    private String rowStatus;

    /* 아래 5개는 요청 시에는 무시되고, applyChanges() 가 처리 결과로 채워 돌려준다. */
    private Long fileSize;
    private String fileExt;
    private String storagePath;
    private String refTableNm;
    private String refId;
}
