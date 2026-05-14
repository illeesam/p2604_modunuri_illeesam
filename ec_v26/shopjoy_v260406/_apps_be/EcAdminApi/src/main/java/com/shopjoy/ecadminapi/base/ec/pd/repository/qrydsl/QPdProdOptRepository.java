package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;

import java.util.List;
import java.util.Optional;

/** PdProdOpt QueryDSL Custom Repository */
public interface QPdProdOptRepository {

    Optional<PdProdOptDto.Item> selectById(String optId);

    List<PdProdOptDto.Item> selectList(PdProdOptDto.Request search);

    PdProdOptDto.PageResponse selectPageList(PdProdOptDto.Request search);

    int updateSelective(PdProdOpt entity);
}
