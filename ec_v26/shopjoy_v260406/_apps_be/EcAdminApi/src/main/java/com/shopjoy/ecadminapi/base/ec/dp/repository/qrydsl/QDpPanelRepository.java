package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface QDpPanelRepository {
    Optional<DpPanelDto.Item> selectById(String panelId);
    List<DpPanelDto.Item> selectList(DpPanelDto.Request search);
    DpPanelDto.PageResponse selectPageList(DpPanelDto.Request search);
    int updateSelective(DpPanel entity);
    /** 표시경로 노드별 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL).
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    List<Map<String, Object>> selectPathTreeCntsByBizCd(DpPanelDto.Request search);
}
