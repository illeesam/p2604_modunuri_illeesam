package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscnt;

import java.util.List;
import java.util.Optional;

/** PmDiscnt QueryDSL Custom Repository */
public interface QPmDiscntRepository {

    Optional<PmDiscntDto.Item> selectById(String discntId);

    List<PmDiscntDto.Item> selectList(PmDiscntDto.Request search);

    BasePage<PmDiscntDto.Item> selectPageData(PmDiscntDto.Request search);

    int updateSelective(PmDiscnt entity);

    /** 상태 배치 동기화 대상 — useYn=Y AND ACTIVE (mutate+save 필요, DTO selectList 와 다른 반환타입).
     *  base 의 findSyncTargets 대체 (2026-08-27) */
    List<PmDiscnt> selectSyncTargets();
}
