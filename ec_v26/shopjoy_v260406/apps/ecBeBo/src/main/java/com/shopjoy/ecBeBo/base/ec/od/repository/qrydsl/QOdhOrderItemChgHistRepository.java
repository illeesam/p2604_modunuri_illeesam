package com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdhOrderItemChgHistDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdhOrderItemChgHist;

import java.util.List;
import java.util.Optional;

/** OdhOrderItemChgHist QueryDSL Custom Repository */
public interface QOdhOrderItemChgHistRepository {

    Optional<OdhOrderItemChgHistDto.Item> selectById(String id);

    List<OdhOrderItemChgHistDto.Item> selectList(OdhOrderItemChgHistDto.Request search);

    BasePage<OdhOrderItemChgHistDto.Item> selectPageData(OdhOrderItemChgHistDto.Request search);

    int updateSelective(OdhOrderItemChgHist entity);
}
