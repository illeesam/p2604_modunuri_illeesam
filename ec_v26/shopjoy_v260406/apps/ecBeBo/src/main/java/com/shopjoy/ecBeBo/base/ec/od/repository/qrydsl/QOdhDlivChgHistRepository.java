package com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdhDlivChgHistDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdhDlivChgHist;

import java.util.List;
import java.util.Optional;

/** OdhDlivChgHist QueryDSL Custom Repository */
public interface QOdhDlivChgHistRepository {

    Optional<OdhDlivChgHistDto.Item> selectById(String id);

    List<OdhDlivChgHistDto.Item> selectList(OdhDlivChgHistDto.Request search);

    BasePage<OdhDlivChgHistDto.Item> selectPageData(OdhDlivChgHistDto.Request search);

    int updateSelective(OdhDlivChgHist entity);
}
