package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivItemChgHist;

import java.util.List;
import java.util.Optional;

/** OdhDlivItemChgHist QueryDSL Custom Repository */
public interface QOdhDlivItemChgHistRepository {

    Optional<OdhDlivItemChgHistDto.Item> selectById(String id);

    List<OdhDlivItemChgHistDto.Item> selectList(OdhDlivItemChgHistDto.Request search);

    OdhDlivItemChgHistDto.PageResponse selectPageList(OdhDlivItemChgHistDto.Request search);

    int updateSelective(OdhDlivItemChgHist entity);
}
