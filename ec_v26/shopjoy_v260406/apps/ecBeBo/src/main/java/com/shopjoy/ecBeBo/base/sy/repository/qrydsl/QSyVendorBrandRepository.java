package com.shopjoy.ecBeBo.base.sy.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyVendorBrandDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyVendorBrand;

import java.util.List;
import java.util.Optional;

/** SyVendorBrand QueryDSL Custom Repository */
public interface QSyVendorBrandRepository {

    Optional<SyVendorBrandDto.Item> selectById(String vendorBrandId);

    List<SyVendorBrandDto.Item> selectList(SyVendorBrandDto.Request search);

    BasePage<SyVendorBrandDto.Item> selectPageData(SyVendorBrandDto.Request search);

    int updateSelective(SyVendorBrand entity);
}
