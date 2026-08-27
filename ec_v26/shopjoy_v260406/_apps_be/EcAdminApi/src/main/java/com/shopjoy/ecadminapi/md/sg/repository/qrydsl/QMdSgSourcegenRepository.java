package com.shopjoy.ecadminapi.md.sg.repository.qrydsl;

import com.shopjoy.ecadminapi.md.sg.data.entity.MdSgSourcegen;

import java.util.List;

/**
 * MdSgSourcegen QueryDSL Custom Repository.
 *
 * <p>DTO 투영 화면(검색/페이징)이 없는 순수 자식 컬렉션(프로젝트의 DDL 탭)이라 baseSelColumnQuery 없이
 * 엔티티를 그대로 반환한다(PdProdStock 과 동일한 "단순 구조" 패턴).</p>
 */
public interface QMdSgSourcegenRepository {

    /** 프로젝트별 DDL 탭 목록 — tabNo asc. base 의 findByProjectIdOrderByTabNoAsc 대체 (2026-08-27) */
    List<MdSgSourcegen> selectListByProjectId(String projectId);
}
