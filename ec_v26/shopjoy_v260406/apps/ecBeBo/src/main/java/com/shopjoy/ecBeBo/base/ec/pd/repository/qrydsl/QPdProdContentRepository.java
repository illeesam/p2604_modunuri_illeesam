package com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdProdContentDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdContent;

import java.util.List;
import java.util.Optional;

/** PdProdContent QueryDSL Custom Repository */
public interface QPdProdContentRepository {

    Optional<PdProdContentDto.Item> selectById(String prodContentId);

    List<PdProdContentDto.Item> selectList(PdProdContentDto.Request search);

    BasePage<PdProdContentDto.Item> selectPageData(PdProdContentDto.Request search);

    int updateSelective(PdProdContent entity);
}
