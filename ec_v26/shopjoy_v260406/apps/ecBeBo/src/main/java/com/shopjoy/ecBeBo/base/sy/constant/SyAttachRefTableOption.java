package com.shopjoy.ecBeBo.base.sy.constant;

/**
 * sy_attach.ref_table_nm 옵션 1건 — {@code GET /co/cm/upload/ref/table-options} 로 프론트에 내려준다.
 *
 * @param key   프론트가 "이건 내 화면 거야" 를 찾는 안정적인 식별자(스크린 단위 고유, snake_case 테이블명보다 오타에 덜 취약)
 * @param value 실제 sy_attach.ref_table_nm 값 — {@link SyAttachRefTableConst} 상수와 동일
 * @param label 표시용 한글 라벨
 */
public record SyAttachRefTableOption(String key, String value, String label) {
}
