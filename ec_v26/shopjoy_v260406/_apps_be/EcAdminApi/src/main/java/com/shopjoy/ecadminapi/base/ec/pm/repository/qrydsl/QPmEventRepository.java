package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;

import java.util.List;
import java.util.Optional;

/** PmEvent QueryDSL Custom Repository */
public interface QPmEventRepository {

    Optional<PmEventDto.Item> selectById(String eventId);

    List<PmEventDto.Item> selectList(PmEventDto.Request search);

    BasePage<PmEventDto.Item> selectPageData(PmEventDto.Request search);

    int updateSelective(PmEvent entity);

    /** 상태 배치 동기화 대상 — useYn=Y AND (PENDING/ACTIVE) (mutate+save 필요, DTO selectList 와 다른 반환타입).
     *  base 의 findSyncTargets 대체 (2026-08-27) */
    List<PmEvent> selectSyncTargets();
}
