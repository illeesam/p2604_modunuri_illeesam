package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;

import java.util.List;
import java.util.Optional;

/** PmGift QueryDSL Custom Repository */
public interface QPmGiftRepository {

    /** 단건 조회 */
    Optional<PmGiftDto.Item> selectById(String giftId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<PmGiftDto.Item> selectList(PmGiftDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    BasePage<PmGiftDto.Item> selectPageData(PmGiftDto.Request search);

    int updateSelective(PmGift entity);

    /** 상태 배치 동기화 대상 — useYn=Y AND ACTIVE (mutate+save 필요, DTO selectList 와 다른 반환타입).
     *  base 의 findSyncTargets 대체 (2026-08-27) */
    List<PmGift> selectSyncTargets();
}
