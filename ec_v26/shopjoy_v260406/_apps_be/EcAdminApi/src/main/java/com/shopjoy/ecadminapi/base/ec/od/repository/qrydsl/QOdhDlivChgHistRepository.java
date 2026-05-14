package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivChgHist;

import java.util.List;
import java.util.Optional;

/** OdhDlivChgHist QueryDSL Custom Repository */
public interface QOdhDlivChgHistRepository {

    Optional<OdhDlivChgHistDto.Item> selectById(String id);

    List<OdhDlivChgHistDto.Item> selectList(OdhDlivChgHistDto.Request search);

    OdhDlivChgHistDto.PageResponse selectPageList(OdhDlivChgHistDto.Request search);

    int updateSelective(OdhDlivChgHist entity);
}
