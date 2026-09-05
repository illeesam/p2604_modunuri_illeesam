package com.shopjoy.ecBeBo.base.sy.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyVendorContentDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyVendorContent;

import java.util.List;
import java.util.Optional;

/** SyVendorContent QueryDSL Custom Repository */
public interface QSyVendorContentRepository {

    Optional<SyVendorContentDto.Item> selectById(String vendorContentId);

    List<SyVendorContentDto.Item> selectList(SyVendorContentDto.Request search);

    BasePage<SyVendorContentDto.Item> selectPageData(SyVendorContentDto.Request search);

    int updateSelective(SyVendorContent entity);
}
