package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.dto.SySiteDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;

import java.util.List;
import java.util.Optional;

/** SySite QueryDSL Custom Repository */
public interface QSySiteRepository {

    Optional<SySiteDto.Item> selectById(String siteId);

    List<SySiteDto.Item> selectList(SySiteDto.Request search);

    SySiteDto.PageResponse selectPageList(SySiteDto.Request search);

    int updateSelective(SySite entity);
}
