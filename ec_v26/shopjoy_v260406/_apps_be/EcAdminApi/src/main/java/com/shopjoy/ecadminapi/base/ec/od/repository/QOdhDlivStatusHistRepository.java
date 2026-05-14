package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivStatusHist;

import java.util.List;
import java.util.Optional;

/** OdhDlivStatusHist QueryDSL Custom Repository */
public interface QOdhDlivStatusHistRepository {

    Optional<OdhDlivStatusHistDto.Item> selectById(String id);

    List<OdhDlivStatusHistDto.Item> selectList(OdhDlivStatusHistDto.Request search);

    OdhDlivStatusHistDto.PageResponse selectPageList(OdhDlivStatusHistDto.Request search);

    int updateSelective(OdhDlivStatusHist entity);
}
