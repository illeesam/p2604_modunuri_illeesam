package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 첨부파일 연계 변경 1건 — 부모 레코드 저장(create/update) 요청 바디에 attachChanges 로 함께 실려온다.
 * 요청 전용 DTO — attachId/rowStatus 만 의미 있다. rowStatus: I(연계 반영) / D(연계 삭제, 물리 삭제 포함).
 * U(부가정보 수정)는 추후 지원 예정.
 *
 * <p>저장 후 실제 첨부 리소스 정보(파일명/URL/크기 등)가 필요한 응답 쪽은 이 타입을 재사용하지 않고
 * {@code SyAttachDto.Brief} 로 별도 필드(관례상 {@code attachFiles}, 슬롯이 2개면 {@code attach2Files})에
 * 담아 내려준다 — {@code SyAttachService#getBriefsByRef} 참조. §10-A/§10-C.</p>
 */
@Getter @Setter @NoArgsConstructor
public class SyAttachChangeItem {
    private String attachId;
    private String rowStatus;
}
