package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptTypeDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOptType;

import java.util.List;
import java.util.Optional;

/** PdProdOptType QueryDSL Custom Repository */
public interface QPdProdOptTypeRepository {

    Optional<PdProdOptTypeDto.Item> selectById(String optTypeId);

    List<PdProdOptTypeDto.Item> selectList(PdProdOptTypeDto.Request search);

    PdProdOptTypeDto.PageResponse selectPageData(PdProdOptTypeDto.Request search);

    int updateSelective(PdProdOptType entity);
}
