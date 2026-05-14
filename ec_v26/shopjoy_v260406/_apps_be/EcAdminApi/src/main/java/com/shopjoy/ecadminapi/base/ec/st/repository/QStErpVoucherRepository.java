package com.shopjoy.ecadminapi.base.ec.st.repository;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucher;

import java.util.List;
import java.util.Optional;

/** StErpVoucher QueryDSL Custom Repository */
public interface QStErpVoucherRepository {

    Optional<StErpVoucherDto.Item> selectById(String id);

    List<StErpVoucherDto.Item> selectList(StErpVoucherDto.Request search);

    StErpVoucherDto.PageResponse selectPageList(StErpVoucherDto.Request search);

    int updateSelective(StErpVoucher entity);
}
