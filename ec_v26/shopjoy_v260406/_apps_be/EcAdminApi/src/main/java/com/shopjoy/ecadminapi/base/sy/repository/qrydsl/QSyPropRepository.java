package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPropDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;

import java.util.List;
import java.util.Optional;

/** SyProp QueryDSL Custom Repository */
public interface QSyPropRepository {
    Optional<SyPropDto.Item> selectById(String propId);
    List<SyPropDto.Item> selectList(SyPropDto.Request search);
    SyPropDto.PageResponse selectPageList(SyPropDto.Request search);
    int updateSelective(SyProp entity);
}
