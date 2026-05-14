package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefund;

import java.util.List;
import java.util.Optional;

/** OdRefund QueryDSL Custom Repository */
public interface QOdRefundRepository {

    Optional<OdRefundDto.Item> selectById(String refundId);

    List<OdRefundDto.Item> selectList(OdRefundDto.Request search);

    OdRefundDto.PageResponse selectPageList(OdRefundDto.Request search);

    int updateSelective(OdRefund entity);
}
