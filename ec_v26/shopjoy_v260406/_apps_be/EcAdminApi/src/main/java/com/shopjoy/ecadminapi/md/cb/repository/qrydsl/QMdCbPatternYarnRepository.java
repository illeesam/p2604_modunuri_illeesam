package com.shopjoy.ecadminapi.md.cb.repository.qrydsl;

import com.shopjoy.ecadminapi.md.cb.data.entity.MdCbPatternYarn;

import java.util.List;

/**
 * MdCbPatternYarn QueryDSL Custom Repository.
 *
 * <p>DTO 투영 화면(검색/페이징)이 없는 순수 자식 컬렉션(도안-실 매핑)이라 baseSelColumnQuery 없이
 * 엔티티를 그대로 반환한다(PdProdStock 과 동일한 "단순 구조" 패턴).</p>
 */
public interface QMdCbPatternYarnRepository {

    /** 도안-실 매핑 목록 — regDate asc. base 의 findByPatternIdOrderByRegDateAsc 대체 (2026-08-27) */
    List<MdCbPatternYarn> selectListByPatternId(String patternId);
}
