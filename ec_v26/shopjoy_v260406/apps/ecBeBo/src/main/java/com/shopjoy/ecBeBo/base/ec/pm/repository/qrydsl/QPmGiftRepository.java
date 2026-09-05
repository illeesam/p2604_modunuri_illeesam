package com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmGift;

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
}
