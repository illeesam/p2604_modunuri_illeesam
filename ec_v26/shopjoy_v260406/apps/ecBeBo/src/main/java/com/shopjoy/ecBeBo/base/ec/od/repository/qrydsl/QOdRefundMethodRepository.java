package com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdRefundMethodDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdRefundMethod;

import java.util.List;
import java.util.Optional;

/** OdRefundMethod QueryDSL Custom Repository */
public interface QOdRefundMethodRepository {

    Optional<OdRefundMethodDto.Item> selectById(String refundMethodId);

    List<OdRefundMethodDto.Item> selectList(OdRefundMethodDto.Request search);

    BasePage<OdRefundMethodDto.Item> selectPageData(OdRefundMethodDto.Request search);

    int updateSelective(OdRefundMethod entity);
}
