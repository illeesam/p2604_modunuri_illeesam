package com.shopjoy.ecBeBo.base.ec.st.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StErpVoucherLineDto;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StErpVoucherLine;

import java.util.List;
import java.util.Optional;

/** StErpVoucherLine QueryDSL Custom Repository */
public interface QStErpVoucherLineRepository {

    Optional<StErpVoucherLineDto.Item> selectById(String id);

    List<StErpVoucherLineDto.Item> selectList(StErpVoucherLineDto.Request search);

    BasePage<StErpVoucherLineDto.Item> selectPageData(StErpVoucherLineDto.Request search);

    int updateSelective(StErpVoucherLine entity);
}
