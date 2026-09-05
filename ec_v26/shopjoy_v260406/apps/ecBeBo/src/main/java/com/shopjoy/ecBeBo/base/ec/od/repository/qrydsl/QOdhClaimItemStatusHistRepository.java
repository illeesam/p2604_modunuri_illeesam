package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemStatusHist;

import java.util.List;
import java.util.Optional;

/** OdhClaimItemStatusHist QueryDSL Custom Repository */
public interface QOdhClaimItemStatusHistRepository {

    Optional<OdhClaimItemStatusHistDto.Item> selectById(String id);

    List<OdhClaimItemStatusHistDto.Item> selectList(OdhClaimItemStatusHistDto.Request search);

    BasePage<OdhClaimItemStatusHistDto.Item> selectPageData(OdhClaimItemStatusHistDto.Request search);

    int updateSelective(OdhClaimItemStatusHist entity);
}
