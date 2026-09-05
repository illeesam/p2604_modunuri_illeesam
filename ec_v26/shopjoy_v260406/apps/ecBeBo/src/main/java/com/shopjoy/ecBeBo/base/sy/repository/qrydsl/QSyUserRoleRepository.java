package com.shopjoy.ecBeBo.base.sy.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyUserRole;

import java.util.List;
import java.util.Optional;

/** SyUserRole QueryDSL Custom Repository */
public interface QSyUserRoleRepository {

    Optional<SyUserRoleDto.Item> selectById(String userRoleId);

    List<SyUserRoleDto.Item> selectList(SyUserRoleDto.Request search);

    BasePage<SyUserRoleDto.Item> selectPageData(SyUserRoleDto.Request search);

    int updateSelective(SyUserRole entity);
}
