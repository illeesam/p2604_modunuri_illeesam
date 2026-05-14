package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimStatusHist;

import java.util.List;
import java.util.Optional;

/** OdhClaimStatusHist QueryDSL Custom Repository */
public interface QOdhClaimStatusHistRepository {

    Optional<OdhClaimStatusHistDto.Item> selectById(String id);

    List<OdhClaimStatusHistDto.Item> selectList(OdhClaimStatusHistDto.Request search);

    OdhClaimStatusHistDto.PageResponse selectPageList(OdhClaimStatusHistDto.Request search);

    int updateSelective(OdhClaimStatusHist entity);
}
