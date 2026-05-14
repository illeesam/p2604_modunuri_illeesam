package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbsDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;

import java.util.List;
import java.util.Optional;

/** SyBbs QueryDSL Custom Repository */
public interface QSyBbsRepository {
    Optional<SyBbsDto.Item> selectById(String bbsId);
    List<SyBbsDto.Item> selectList(SyBbsDto.Request search);
    SyBbsDto.PageResponse selectPageList(SyBbsDto.Request search);
    int updateSelective(SyBbs entity);
}
