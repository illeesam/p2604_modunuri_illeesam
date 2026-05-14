package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderChgHist;

import java.util.List;
import java.util.Optional;

/** OdhOrderChgHist QueryDSL Custom Repository */
public interface QOdhOrderChgHistRepository {

    Optional<OdhOrderChgHistDto.Item> selectById(String id);

    List<OdhOrderChgHistDto.Item> selectList(OdhOrderChgHistDto.Request search);

    OdhOrderChgHistDto.PageResponse selectPageList(OdhOrderChgHistDto.Request search);

    int updateSelective(OdhOrderChgHist entity);
}
