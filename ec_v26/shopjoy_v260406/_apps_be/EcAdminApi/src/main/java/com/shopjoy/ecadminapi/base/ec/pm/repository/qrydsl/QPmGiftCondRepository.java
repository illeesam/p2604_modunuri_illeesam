package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftCondDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftCond;

import java.util.List;
import java.util.Optional;

/** PmGiftCond QueryDSL Custom Repository */
public interface QPmGiftCondRepository {

    Optional<PmGiftCondDto.Item> selectById(String giftCondId);

    List<PmGiftCondDto.Item> selectList(PmGiftCondDto.Request search);

    PmGiftCondDto.PageResponse selectPageList(PmGiftCondDto.Request search);

    int updateSelective(PmGiftCond entity);
}
