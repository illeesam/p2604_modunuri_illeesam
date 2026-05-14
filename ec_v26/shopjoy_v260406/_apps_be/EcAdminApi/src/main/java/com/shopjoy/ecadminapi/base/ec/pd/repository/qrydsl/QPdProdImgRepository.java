package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdImgDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdImg;

import java.util.List;
import java.util.Optional;

/** PdProdImg QueryDSL Custom Repository */
public interface QPdProdImgRepository {

    Optional<PdProdImgDto.Item> selectById(String prodImgId);

    List<PdProdImgDto.Item> selectList(PdProdImgDto.Request search);

    PdProdImgDto.PageResponse selectPageList(PdProdImgDto.Request search);

    int updateSelective(PdProdImg entity);
}
