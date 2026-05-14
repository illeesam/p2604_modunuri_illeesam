package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderStatusHist;

import java.util.List;
import java.util.Optional;

/** OdhOrderStatusHist QueryDSL Custom Repository */
public interface QOdhOrderStatusHistRepository {

    Optional<OdhOrderStatusHistDto.Item> selectById(String id);

    List<OdhOrderStatusHistDto.Item> selectList(OdhOrderStatusHistDto.Request search);

    OdhOrderStatusHistDto.PageResponse selectPageList(OdhOrderStatusHistDto.Request search);

    int updateSelective(OdhOrderStatusHist entity);
}
