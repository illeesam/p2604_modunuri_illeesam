package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayChgHist;

import java.util.List;
import java.util.Optional;

/** OdhPayChgHist QueryDSL Custom Repository */
public interface QOdhPayChgHistRepository {

    Optional<OdhPayChgHistDto.Item> selectById(String id);

    List<OdhPayChgHistDto.Item> selectList(OdhPayChgHistDto.Request search);

    OdhPayChgHistDto.PageResponse selectPageList(OdhPayChgHistDto.Request search);

    int updateSelective(OdhPayChgHist entity);
}
