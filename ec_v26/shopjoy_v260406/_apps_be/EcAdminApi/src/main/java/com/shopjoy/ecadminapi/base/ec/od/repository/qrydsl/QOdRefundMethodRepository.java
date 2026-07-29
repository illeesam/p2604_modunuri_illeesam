package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefundMethod;

import java.util.List;
import java.util.Optional;

/** OdRefundMethod QueryDSL Custom Repository */
public interface QOdRefundMethodRepository {

    Optional<OdRefundMethodDto.Item> selectById(String refundMethodId);

    List<OdRefundMethodDto.Item> selectList(OdRefundMethodDto.Request search);

    BasePage<OdRefundMethodDto.Item> selectPageData(OdRefundMethodDto.Request search);

    int updateSelective(OdRefundMethod entity);
}
