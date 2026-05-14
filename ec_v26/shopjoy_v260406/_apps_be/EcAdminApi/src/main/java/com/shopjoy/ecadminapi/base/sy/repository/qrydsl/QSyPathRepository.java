package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPathDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyPath;

import java.util.List;
import java.util.Optional;

/** SyPath QueryDSL Custom Repository */
public interface QSyPathRepository {
    Optional<SyPathDto.Item> selectById(String pathId);
    List<SyPathDto.Item> selectList(SyPathDto.Request search);
    SyPathDto.PageResponse selectPageList(SyPathDto.Request search);
    int updateSelective(SyPath entity);
}
