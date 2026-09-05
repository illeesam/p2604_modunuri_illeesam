package com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmVoucherDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmVoucher;

import java.util.List;
import java.util.Optional;

/** PmVoucher QueryDSL Custom Repository */
public interface QPmVoucherRepository {

    Optional<PmVoucherDto.Item> selectById(String voucherId);

    List<PmVoucherDto.Item> selectList(PmVoucherDto.Request search);

    BasePage<PmVoucherDto.Item> selectPageData(PmVoucherDto.Request search);

    int updateSelective(PmVoucher entity);
}
