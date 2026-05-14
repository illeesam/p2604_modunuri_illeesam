package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemStatusHist;

import java.util.List;
import java.util.Optional;

/** OdhClaimItemStatusHist QueryDSL Custom Repository */
public interface QOdhClaimItemStatusHistRepository {

    Optional<OdhClaimItemStatusHistDto.Item> selectById(String id);

    List<OdhClaimItemStatusHistDto.Item> selectList(OdhClaimItemStatusHistDto.Request search);

    OdhClaimItemStatusHistDto.PageResponse selectPageList(OdhClaimItemStatusHistDto.Request search);

    int updateSelective(OdhClaimItemStatusHist entity);
}
