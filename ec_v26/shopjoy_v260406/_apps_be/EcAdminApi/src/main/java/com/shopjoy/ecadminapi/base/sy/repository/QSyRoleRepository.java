package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;

import java.util.List;
import java.util.Optional;

/** SyRole QueryDSL Custom Repository */
public interface QSyRoleRepository {

    Optional<SyRoleDto.Item> selectById(String roleId);

    List<SyRoleDto.Item> selectList(SyRoleDto.Request search);

    SyRoleDto.PageResponse selectPageList(SyRoleDto.Request search);

    int updateSelective(SyRole entity);
}
