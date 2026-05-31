package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbm;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/** SyBbm QueryDSL Custom Repository */
public interface QSyBbmRepository {
    Optional<SyBbmDto.Item> selectById(String bbmId);
    List<SyBbmDto.Item> selectList(SyBbmDto.Request search);
    SyBbmDto.PageResponse selectPageData(SyBbmDto.Request search);
    int updateSelective(SyBbm entity);
    /** 표시경로 노드별 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL).
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    List<Map<String, Object>> selectPathTreeBbmCnts(SyBbmDto.Request search);
}
