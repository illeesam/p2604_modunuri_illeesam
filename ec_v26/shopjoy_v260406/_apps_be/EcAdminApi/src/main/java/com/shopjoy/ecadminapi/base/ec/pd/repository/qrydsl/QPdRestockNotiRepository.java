package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdRestockNotiDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdRestockNoti;

import java.util.List;
import java.util.Optional;

/** PdRestockNoti QueryDSL Custom Repository */
public interface QPdRestockNotiRepository {

    Optional<PdRestockNotiDto.Item> selectById(String restockNotiId);

    List<PdRestockNotiDto.Item> selectList(PdRestockNotiDto.Request search);

    BasePage<PdRestockNotiDto.Item> selectPageData(PdRestockNotiDto.Request search);

    int updateSelective(PdRestockNoti entity);
}
