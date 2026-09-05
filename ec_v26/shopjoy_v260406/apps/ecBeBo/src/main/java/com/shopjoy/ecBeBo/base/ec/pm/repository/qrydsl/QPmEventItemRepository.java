package com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmEventItemDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmEventItem;

import java.util.List;
import java.util.Optional;

/** PmEventItem QueryDSL Custom Repository */
public interface QPmEventItemRepository {

    Optional<PmEventItemDto.Item> selectById(String eventItemId);

    List<PmEventItemDto.Item> selectList(PmEventItemDto.Request search);

    BasePage<PmEventItemDto.Item> selectPageData(PmEventItemDto.Request search);

    int updateSelective(PmEventItem entity);
}
