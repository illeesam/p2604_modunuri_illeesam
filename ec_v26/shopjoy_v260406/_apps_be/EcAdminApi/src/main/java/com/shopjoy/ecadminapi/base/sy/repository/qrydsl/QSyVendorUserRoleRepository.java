package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUserRole;

import java.util.List;
import java.util.Optional;

/** SyVendorUserRole QueryDSL Custom Repository */
public interface QSyVendorUserRoleRepository {

    Optional<SyVendorUserRoleDto.Item> selectById(String vendorUserRoleId);

    List<SyVendorUserRoleDto.Item> selectList(SyVendorUserRoleDto.Request search);

    SyVendorUserRoleDto.PageResponse selectPageList(SyVendorUserRoleDto.Request search);

    int updateSelective(SyVendorUserRole entity);
}
