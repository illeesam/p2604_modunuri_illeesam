package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRoleMenu;

import java.util.List;
import java.util.Optional;

/** SyRoleMenu QueryDSL Custom Repository */
public interface QSyRoleMenuRepository {

    Optional<SyRoleMenuDto.Item> selectById(String roleMenuId);

    List<SyRoleMenuDto.Item> selectList(SyRoleMenuDto.Request search);

    SyRoleMenuDto.PageResponse selectPageList(SyRoleMenuDto.Request search);

    int updateSelective(SyRoleMenu entity);
}
