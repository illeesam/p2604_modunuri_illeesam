package com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdProdSkuDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdSku;

import java.util.List;
import java.util.Optional;

/** PdProdSku QueryDSL Custom Repository */
public interface QPdProdSkuRepository {

    Optional<PdProdSkuDto.Item> selectById(String skuId);

    List<PdProdSkuDto.Item> selectList(PdProdSkuDto.Request search);

    BasePage<PdProdSkuDto.Item> selectPageData(PdProdSkuDto.Request search);

    int updateSelective(PdProdSku entity);
}
