package com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmSaveItemDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmSaveItem;

import java.util.List;
import java.util.Optional;

/** PmSaveItem QueryDSL Custom Repository */
public interface QPmSaveItemRepository {

    Optional<PmSaveItemDto.Item> selectById(String saveItemId);

    List<PmSaveItemDto.Item> selectList(PmSaveItemDto.Request search);

    BasePage<PmSaveItemDto.Item> selectPageData(PmSaveItemDto.Request search);

    int updateSelective(PmSaveItem entity);
}
