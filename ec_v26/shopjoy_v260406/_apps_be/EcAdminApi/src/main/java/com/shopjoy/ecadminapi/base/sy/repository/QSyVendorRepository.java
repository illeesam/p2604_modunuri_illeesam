package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;

import java.util.List;
import java.util.Optional;

/** SyVendor QueryDSL Custom Repository */
public interface QSyVendorRepository {

    Optional<SyVendorDto.Item> selectById(String vendorId);

    List<SyVendorDto.Item> selectList(SyVendorDto.Request search);

    SyVendorDto.PageResponse selectPageList(SyVendorDto.Request search);

    int updateSelective(SyVendor entity);
}
