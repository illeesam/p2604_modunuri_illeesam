package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface QDpWidgetRepository {
    Optional<DpWidgetDto.Item> selectById(String widgetId);
    List<DpWidgetDto.Item> selectList(DpWidgetDto.Request search);
    DpWidgetDto.PageResponse selectPageList(DpWidgetDto.Request search);
    int updateSelective(DpWidget entity);
    /** 표시경로 노드별 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL).
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    List<Map<String, Object>> selectPathTreeWidgetCnts(DpWidgetDto.Request search);
}
