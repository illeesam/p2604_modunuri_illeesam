package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdCartDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdCart;

import java.util.List;
import java.util.Optional;

/** OdCart QueryDSL Custom Repository */
public interface QOdCartRepository {

    Optional<OdCartDto.Item> selectById(String cartId);

    List<OdCartDto.Item> selectList(OdCartDto.Request search);

    OdCartDto.PageResponse selectPageList(OdCartDto.Request search);

    int updateSelective(OdCart entity);
}
