package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBrand;

import java.util.List;
import java.util.Optional;

/** SyBrand QueryDSL Custom Repository */
public interface QSyBrandRepository {

    Optional<SyBrandDto.Item> selectById(String brandId);

    List<SyBrandDto.Item> selectList(SyBrandDto.Request search);

    SyBrandDto.PageResponse selectPageList(SyBrandDto.Request search);

    int updateSelective(SyBrand entity);
}
