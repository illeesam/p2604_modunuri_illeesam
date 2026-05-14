package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemChgHist;

import java.util.List;
import java.util.Optional;

/** OdhOrderItemChgHist QueryDSL Custom Repository */
public interface QOdhOrderItemChgHistRepository {

    Optional<OdhOrderItemChgHistDto.Item> selectById(String id);

    List<OdhOrderItemChgHistDto.Item> selectList(OdhOrderItemChgHistDto.Request search);

    OdhOrderItemChgHistDto.PageResponse selectPageList(OdhOrderItemChgHistDto.Request search);

    int updateSelective(OdhOrderItemChgHist entity);
}
