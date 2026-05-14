package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemChgHist;

import java.util.List;
import java.util.Optional;

/** OdhClaimItemChgHist QueryDSL Custom Repository */
public interface QOdhClaimItemChgHistRepository {

    Optional<OdhClaimItemChgHistDto.Item> selectById(String id);

    List<OdhClaimItemChgHistDto.Item> selectList(OdhClaimItemChgHistDto.Request search);

    OdhClaimItemChgHistDto.PageResponse selectPageList(OdhClaimItemChgHistDto.Request search);

    int updateSelective(OdhClaimItemChgHist entity);
}
