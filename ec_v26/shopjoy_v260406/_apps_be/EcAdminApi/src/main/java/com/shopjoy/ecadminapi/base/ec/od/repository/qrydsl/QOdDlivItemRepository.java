package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDlivItem;

import java.util.List;
import java.util.Optional;

/** OdDlivItem QueryDSL Custom Repository */
public interface QOdDlivItemRepository {

    Optional<OdDlivItemDto.Item> selectById(String dlivItemId);

    List<OdDlivItemDto.Item> selectList(OdDlivItemDto.Request search);

    BasePage<OdDlivItemDto.Item> selectPageData(OdDlivItemDto.Request search);

    int updateSelective(OdDlivItem entity);
}
