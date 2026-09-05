package com.shopjoy.ecBeBo.base.ec.st.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StErpVoucherDto;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StErpVoucher;

import java.util.List;
import java.util.Optional;

/** StErpVoucher QueryDSL Custom Repository */
public interface QStErpVoucherRepository {

    Optional<StErpVoucherDto.Item> selectById(String id);

    List<StErpVoucherDto.Item> selectList(StErpVoucherDto.Request search);

    BasePage<StErpVoucherDto.Item> selectPageData(StErpVoucherDto.Request search);

    int updateSelective(StErpVoucher entity);
}
