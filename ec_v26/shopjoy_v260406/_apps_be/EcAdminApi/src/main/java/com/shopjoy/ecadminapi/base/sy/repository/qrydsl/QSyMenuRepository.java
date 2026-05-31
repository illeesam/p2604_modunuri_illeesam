package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/** SyMenu QueryDSL Custom Repository */
public interface QSyMenuRepository {

    Optional<SyMenuDto.Item> selectById(String menuId);

    List<SyMenuDto.Item> selectList(SyMenuDto.Request search);

    SyMenuDto.PageResponse selectPageList(SyMenuDto.Request search);

    int updateSelective(SyMenu entity);
    /** 표시경로 노드별 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL).
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    List<Map<String, Object>> selectPathTreeCntsByBizCd(SyMenuDto.Request search);
}
