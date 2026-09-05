package com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdhClaimChgHistDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdhClaimChgHist;

import java.util.List;
import java.util.Optional;

/** OdhClaimChgHist QueryDSL Custom Repository */
public interface QOdhClaimChgHistRepository {

    Optional<OdhClaimChgHistDto.Item> selectById(String id);

    List<OdhClaimChgHistDto.Item> selectList(OdhClaimChgHistDto.Request search);

    BasePage<OdhClaimChgHistDto.Item> selectPageData(OdhClaimChgHistDto.Request search);

    int updateSelective(OdhClaimChgHist entity);
}
