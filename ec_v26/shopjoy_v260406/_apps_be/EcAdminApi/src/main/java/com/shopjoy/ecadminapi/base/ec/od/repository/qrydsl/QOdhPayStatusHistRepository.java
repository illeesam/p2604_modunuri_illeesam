package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayStatusHist;

import java.util.List;
import java.util.Optional;

/** OdhPayStatusHist QueryDSL Custom Repository */
public interface QOdhPayStatusHistRepository {

    Optional<OdhPayStatusHistDto.Item> selectById(String id);

    List<OdhPayStatusHistDto.Item> selectList(OdhPayStatusHistDto.Request search);

    OdhPayStatusHistDto.PageResponse selectPageList(OdhPayStatusHistDto.Request search);

    int updateSelective(OdhPayStatusHist entity);
}
