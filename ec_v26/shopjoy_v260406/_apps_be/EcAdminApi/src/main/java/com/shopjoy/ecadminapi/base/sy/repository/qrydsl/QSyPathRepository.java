package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyPathDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyPath;

import java.util.List;
import java.util.Optional;

/** SyPath QueryDSL Custom Repository */
public interface QSyPathRepository {
    Optional<SyPathDto.Item> selectById(String pathId);
    List<SyPathDto.Item> selectList(SyPathDto.Request search);
    BasePage<SyPathDto.Item> selectPageData(SyPathDto.Request search);
    int updateSelective(SyPath entity);
}
