package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntItem;

import java.util.List;
import java.util.Optional;

/** PmDiscntItem QueryDSL Custom Repository */
public interface QPmDiscntItemRepository {

    Optional<PmDiscntItemDto.Item> selectById(String discntItemId);

    List<PmDiscntItemDto.Item> selectList(PmDiscntItemDto.Request search);

    BasePage<PmDiscntItemDto.Item> selectPageData(PmDiscntItemDto.Request search);

    int updateSelective(PmDiscntItem entity);
}
