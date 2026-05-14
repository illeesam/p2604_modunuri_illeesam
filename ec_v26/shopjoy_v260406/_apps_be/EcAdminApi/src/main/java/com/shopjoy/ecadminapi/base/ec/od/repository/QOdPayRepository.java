package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPay;

import java.util.List;
import java.util.Optional;

/** OdPay QueryDSL Custom Repository */
public interface QOdPayRepository {

    Optional<OdPayDto.Item> selectById(String payId);

    List<OdPayDto.Item> selectList(OdPayDto.Request search);

    OdPayDto.PageResponse selectPageList(OdPayDto.Request search);

    int updateSelective(OdPay entity);
}
