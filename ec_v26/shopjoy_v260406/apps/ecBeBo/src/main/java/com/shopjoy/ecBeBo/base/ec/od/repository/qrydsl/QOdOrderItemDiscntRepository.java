package com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdOrderItemDiscntDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdOrderItemDiscnt;

import java.util.List;
import java.util.Optional;

/** OdOrderItemDiscnt QueryDSL Custom Repository */
public interface QOdOrderItemDiscntRepository {

    Optional<OdOrderItemDiscntDto.Item> selectById(String orderItemDiscntId);

    List<OdOrderItemDiscntDto.Item> selectList(OdOrderItemDiscntDto.Request search);

    BasePage<OdOrderItemDiscntDto.Item> selectPageData(OdOrderItemDiscntDto.Request search);

    int updateSelective(OdOrderItemDiscnt entity);
}
