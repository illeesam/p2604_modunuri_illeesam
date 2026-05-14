package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;

import java.util.List;
import java.util.Optional;

/** PmEvent QueryDSL Custom Repository */
public interface QPmEventRepository {

    Optional<PmEventDto.Item> selectById(String eventId);

    List<PmEventDto.Item> selectList(PmEventDto.Request search);

    PmEventDto.PageResponse selectPageList(PmEventDto.Request search);

    int updateSelective(PmEvent entity);
}
