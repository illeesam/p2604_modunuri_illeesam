package com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdhClaimItemChgHistDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdhClaimItemChgHist;

import java.util.List;
import java.util.Optional;

/** OdhClaimItemChgHist QueryDSL Custom Repository */
public interface QOdhClaimItemChgHistRepository {

    Optional<OdhClaimItemChgHistDto.Item> selectById(String id);

    List<OdhClaimItemChgHistDto.Item> selectList(OdhClaimItemChgHistDto.Request search);

    BasePage<OdhClaimItemChgHistDto.Item> selectPageData(OdhClaimItemChgHistDto.Request search);

    int updateSelective(OdhClaimItemChgHist entity);
}
