package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface QDpAreaRepository {
    Optional<DpAreaDto.Item> selectById(String areaId);
    List<DpAreaDto.Item> selectList(DpAreaDto.Request search);
    DpAreaDto.PageResponse selectPageList(DpAreaDto.Request search);
    int updateSelective(DpArea entity);
    /** 표시경로 노드별 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL).
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    List<Map<String, Object>> selectPathTreeCntsByBizCd(DpAreaDto.Request search);
}
