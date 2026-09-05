package com.shopjoy.ecBeBo.base.sy.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyRoleMenu;

import java.util.List;
import java.util.Optional;

/** SyRoleMenu QueryDSL Custom Repository */
public interface QSyRoleMenuRepository {

    Optional<SyRoleMenuDto.Item> selectById(String roleMenuId);

    List<SyRoleMenuDto.Item> selectList(SyRoleMenuDto.Request search);

    BasePage<SyRoleMenuDto.Item> selectPageData(SyRoleMenuDto.Request search);

    int updateSelective(SyRoleMenu entity);
}
