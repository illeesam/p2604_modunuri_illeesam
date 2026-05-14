package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucher;

import java.util.List;
import java.util.Optional;

/** PmVoucher QueryDSL Custom Repository */
public interface QPmVoucherRepository {

    Optional<PmVoucherDto.Item> selectById(String voucherId);

    List<PmVoucherDto.Item> selectList(PmVoucherDto.Request search);

    PmVoucherDto.PageResponse selectPageList(PmVoucherDto.Request search);

    int updateSelective(PmVoucher entity);
}
