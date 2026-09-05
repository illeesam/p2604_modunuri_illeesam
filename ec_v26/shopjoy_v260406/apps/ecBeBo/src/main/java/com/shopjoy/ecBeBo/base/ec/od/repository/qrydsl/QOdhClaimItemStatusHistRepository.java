package com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdhClaimItemStatusHistDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdhClaimItemStatusHist;

import java.util.List;
import java.util.Optional;

/** OdhClaimItemStatusHist QueryDSL Custom Repository */
public interface QOdhClaimItemStatusHistRepository {

    Optional<OdhClaimItemStatusHistDto.Item> selectById(String id);

    List<OdhClaimItemStatusHistDto.Item> selectList(OdhClaimItemStatusHistDto.Request search);

    BasePage<OdhClaimItemStatusHistDto.Item> selectPageData(OdhClaimItemStatusHistDto.Request search);

    int updateSelective(OdhClaimItemStatusHist entity);
}
