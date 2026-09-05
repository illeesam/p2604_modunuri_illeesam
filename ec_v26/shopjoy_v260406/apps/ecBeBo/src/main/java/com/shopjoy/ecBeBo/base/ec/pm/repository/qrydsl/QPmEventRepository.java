package com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmEvent;

import java.util.List;
import java.util.Optional;

/** PmEvent QueryDSL Custom Repository */
public interface QPmEventRepository {

    Optional<PmEventDto.Item> selectById(String eventId);

    List<PmEventDto.Item> selectList(PmEventDto.Request search);

    BasePage<PmEventDto.Item> selectPageData(PmEventDto.Request search);

    int updateSelective(PmEvent entity);
}
