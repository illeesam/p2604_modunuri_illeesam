package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBatchDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/** SyBatch QueryDSL Custom Repository */
public interface QSyBatchRepository {
    Optional<SyBatchDto.Item> selectById(String batchId);
    List<SyBatchDto.Item> selectList(SyBatchDto.Request search);
    SyBatchDto.PageResponse selectPageData(SyBatchDto.Request search);
    int updateSelective(SyBatch entity);
    /** 표시경로 노드별 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL).
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    List<Map<String, Object>> selectPathTreeBatchCnts(SyBatchDto.Request search);
}
