package com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmCache;

import java.util.List;
import java.util.Optional;

/** PmCache QueryDSL Custom Repository */
public interface QPmCacheRepository {

    Optional<PmCacheDto.Item> selectById(String cacheId);

    List<PmCacheDto.Item> selectList(PmCacheDto.Request search);

    BasePage<PmCacheDto.Item> selectPageData(PmCacheDto.Request search);

    int updateSelective(PmCache entity);
}
