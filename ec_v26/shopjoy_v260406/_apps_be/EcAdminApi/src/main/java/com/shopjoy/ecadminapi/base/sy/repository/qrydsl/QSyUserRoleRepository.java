package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;

import java.util.List;
import java.util.Optional;

/** SyUserRole QueryDSL Custom Repository */
public interface QSyUserRoleRepository {

    Optional<SyUserRoleDto.Item> selectById(String userRoleId);

    List<SyUserRoleDto.Item> selectList(SyUserRoleDto.Request search);

    SyUserRoleDto.PageResponse selectPageList(SyUserRoleDto.Request search);

    int updateSelective(SyUserRole entity);
}
