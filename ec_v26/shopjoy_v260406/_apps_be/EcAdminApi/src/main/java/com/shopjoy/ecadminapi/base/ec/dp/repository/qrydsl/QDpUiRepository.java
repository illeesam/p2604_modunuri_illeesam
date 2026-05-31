package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/** DpUi QueryDSL Custom Repository */
public interface QDpUiRepository {

    Optional<DpUiDto.Item> selectById(String uiId);

    List<DpUiDto.Item> selectList(DpUiDto.Request search);

    DpUiDto.PageResponse selectPageList(DpUiDto.Request search);

    int updateSelective(DpUi entity);
    /** 표시경로 노드별 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL).
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    List<Map<String, Object>> selectPathTreeUiCnts(DpUiDto.Request search);
}
