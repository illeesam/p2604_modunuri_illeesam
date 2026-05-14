package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorBrand;

import java.util.List;
import java.util.Optional;

/** SyVendorBrand QueryDSL Custom Repository */
public interface QSyVendorBrandRepository {

    Optional<SyVendorBrandDto.Item> selectById(String vendorBrandId);

    List<SyVendorBrandDto.Item> selectList(SyVendorBrandDto.Request search);

    SyVendorBrandDto.PageResponse selectPageList(SyVendorBrandDto.Request search);

    int updateSelective(SyVendorBrand entity);
}
