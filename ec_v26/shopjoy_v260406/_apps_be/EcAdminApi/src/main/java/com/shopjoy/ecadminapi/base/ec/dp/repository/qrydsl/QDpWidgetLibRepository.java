package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetLibDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface QDpWidgetLibRepository {
    Optional<DpWidgetLibDto.Item> selectById(String widgetLibId);
    List<DpWidgetLibDto.Item> selectList(DpWidgetLibDto.Request search);
    DpWidgetLibDto.PageResponse selectPageList(DpWidgetLibDto.Request search);
    int updateSelective(DpWidgetLib entity);
    /** 표시경로 노드별 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL).
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    List<Map<String, Object>> selectPathTreeWidgetLibCnts(DpWidgetLibDto.Request search);
}
