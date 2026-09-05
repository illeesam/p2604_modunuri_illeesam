package com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmCouponItemDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmCouponItem;

import java.util.List;
import java.util.Optional;

/** PmCouponItem QueryDSL Custom Repository */
public interface QPmCouponItemRepository {

    Optional<PmCouponItemDto.Item> selectById(String couponItemId);

    List<PmCouponItemDto.Item> selectList(PmCouponItemDto.Request search);

    BasePage<PmCouponItemDto.Item> selectPageData(PmCouponItemDto.Request search);

    int updateSelective(PmCouponItem entity);
}
