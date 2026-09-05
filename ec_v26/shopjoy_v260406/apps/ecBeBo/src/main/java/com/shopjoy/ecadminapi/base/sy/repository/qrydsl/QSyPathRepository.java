package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyPathDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyPath;

import java.util.List;
import java.util.Optional;

/** SyPath QueryDSL Custom Repository */
public interface QSyPathRepository {
    Optional<SyPathDto.Item> selectById(String pathId);
    List<SyPathDto.Item> selectList(SyPathDto.Request search);
    BasePage<SyPathDto.Item> selectPageData(SyPathDto.Request search);
    int updateSelective(SyPath entity);

    /** biz_cd 기준 등록된 모든 path_id 목록 (고아 필터용) — 단일컬럼 투영이라 QueryDSL 사용 */
    List<String> selectAllPathIdsByBizCd(String bizCd);

    /** 루트 path + 모든 자손 path_id 수집(biz_cd 한정, 트리조회 §14.6.9 — QueryDSL 전체조회 + 자바 BFS) */
    List<String> selectTreePathIds(String rootPathId, String bizCd);
}
