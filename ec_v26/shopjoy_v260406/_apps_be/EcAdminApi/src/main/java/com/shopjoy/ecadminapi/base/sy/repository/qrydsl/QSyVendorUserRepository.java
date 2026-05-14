package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUser;

import java.util.List;
import java.util.Optional;

/** SyVendorUser QueryDSL Custom Repository */
public interface QSyVendorUserRepository {

    Optional<SyVendorUserDto.Item> selectById(String vendorUserId);

    List<SyVendorUserDto.Item> selectList(SyVendorUserDto.Request search);

    SyVendorUserDto.PageResponse selectPageList(SyVendorUserDto.Request search);

    int updateSelective(SyVendorUser entity);
}
