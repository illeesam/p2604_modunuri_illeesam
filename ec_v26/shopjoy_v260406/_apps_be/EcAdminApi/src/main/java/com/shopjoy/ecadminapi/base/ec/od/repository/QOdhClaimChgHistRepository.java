package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimChgHist;

import java.util.List;
import java.util.Optional;

/** OdhClaimChgHist QueryDSL Custom Repository */
public interface QOdhClaimChgHistRepository {

    Optional<OdhClaimChgHistDto.Item> selectById(String id);

    List<OdhClaimChgHistDto.Item> selectList(OdhClaimChgHistDto.Request search);

    OdhClaimChgHistDto.PageResponse selectPageList(OdhClaimChgHistDto.Request search);

    int updateSelective(OdhClaimChgHist entity);
}
