package com.shopjoy.ecadminapi.autorest.data.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

/**
 * MyBatis 동적 쿼리용 파라미터 VO
 * AutoRestMapper의 모든 쿼리 메서드에서 공통으로 사용
 */
@Getter
@Builder
public class QueryParam {

    // ── 테이블 기본 정보 ──
    private final String schema;
    private final String table;
    private final String pk;

    // ── 검색 설정 ──
    private final List<String> searchFields;
    private final Map<String, String> cdFields;     // 컬럼명 → 코드그룹 (공통코드 라벨 조회)
    private final Map<String, String> fkFields;     // 컬럼명 → FK 테이블명 (JOIN용)
    private final String dateField;

    // ── SearchRequest 매핑 ──
    private final String kw;
    private final String dateStart;
    private final String dateEnd;
    private final String siteId;
    private final String status;
    private final Map<String, Object> filters;      // 동적 추가 필터 (컬럼명 → 값)
    private final String orderBy;
    private final int limit;
    private final int offset;

    // ── selectById 용 ──
    private final String id;

    // ── selectChildren 용 ──
    private final String fkCol;
    private final Object fkVal;

    // ── selectCodeLabels 용 ──
    private final String codeGrp;
}
