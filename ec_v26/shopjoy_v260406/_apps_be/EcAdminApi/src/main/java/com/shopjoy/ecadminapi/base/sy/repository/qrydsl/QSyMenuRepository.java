package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;

import java.util.List;
import java.util.Optional;

/** SyMenu QueryDSL Custom Repository */
public interface QSyMenuRepository {

    Optional<SyMenuDto.Item> selectById(String menuId);

    List<SyMenuDto.Item> selectList(SyMenuDto.Request search);

    SyMenuDto.PageResponse selectPageList(SyMenuDto.Request search);

    int updateSelective(SyMenu entity);
}
