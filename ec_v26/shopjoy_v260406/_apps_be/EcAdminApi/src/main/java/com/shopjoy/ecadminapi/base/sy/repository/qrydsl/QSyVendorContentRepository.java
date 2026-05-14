package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorContentDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorContent;

import java.util.List;
import java.util.Optional;

/** SyVendorContent QueryDSL Custom Repository */
public interface QSyVendorContentRepository {

    Optional<SyVendorContentDto.Item> selectById(String vendorContentId);

    List<SyVendorContentDto.Item> selectList(SyVendorContentDto.Request search);

    SyVendorContentDto.PageResponse selectPageList(SyVendorContentDto.Request search);

    int updateSelective(SyVendorContent entity);
}
