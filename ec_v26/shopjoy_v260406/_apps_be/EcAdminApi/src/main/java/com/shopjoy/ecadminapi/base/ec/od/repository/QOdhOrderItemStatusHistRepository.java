package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemStatusHist;

import java.util.List;
import java.util.Optional;

/** OdhOrderItemStatusHist QueryDSL Custom Repository */
public interface QOdhOrderItemStatusHistRepository {

    Optional<OdhOrderItemStatusHistDto.Item> selectById(String id);

    List<OdhOrderItemStatusHistDto.Item> selectList(OdhOrderItemStatusHistDto.Request search);

    OdhOrderItemStatusHistDto.PageResponse selectPageList(OdhOrderItemStatusHistDto.Request search);

    int updateSelective(OdhOrderItemStatusHist entity);
}
