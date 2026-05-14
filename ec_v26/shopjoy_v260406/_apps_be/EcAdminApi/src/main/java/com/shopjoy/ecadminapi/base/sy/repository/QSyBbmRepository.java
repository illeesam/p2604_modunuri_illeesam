package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbm;

import java.util.List;
import java.util.Optional;

/** SyBbm QueryDSL Custom Repository */
public interface QSyBbmRepository {
    Optional<SyBbmDto.Item> selectById(String bbmId);
    List<SyBbmDto.Item> selectList(SyBbmDto.Request search);
    SyBbmDto.PageResponse selectPageList(SyBbmDto.Request search);
    int updateSelective(SyBbm entity);
}
