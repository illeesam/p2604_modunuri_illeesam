package com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdhDlivItemChgHistDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdhDlivItemChgHist;

import java.util.List;
import java.util.Optional;

/** OdhDlivItemChgHist QueryDSL Custom Repository */
public interface QOdhDlivItemChgHistRepository {

    Optional<OdhDlivItemChgHistDto.Item> selectById(String id);

    List<OdhDlivItemChgHistDto.Item> selectList(OdhDlivItemChgHistDto.Request search);

    BasePage<OdhDlivItemChgHistDto.Item> selectPageData(OdhDlivItemChgHistDto.Request search);

    int updateSelective(OdhDlivItemChgHist entity);
}
