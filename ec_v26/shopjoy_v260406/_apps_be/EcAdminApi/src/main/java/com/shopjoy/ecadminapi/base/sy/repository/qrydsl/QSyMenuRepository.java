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

    /** 메뉴 트리 노드별 수 집계 (자기참조 자손 누적 + 검색조건 필터, native CTE 동적 SQL).
     *   sy_menu 는 sy_menu.parent_menu_id 자기참조 트리 — sy_path 와 무관.
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 행 포함. pathId 는 menu_id 값. */
    List<Map<String, Object>> selectMenuTreeCnts(SyMenuDto.Request search);
}
