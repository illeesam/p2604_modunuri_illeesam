package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCache;

import java.util.List;
import java.util.Optional;

/** PmCache QueryDSL Custom Repository */
public interface QPmCacheRepository {

    Optional<PmCacheDto.Item> selectById(String cacheId);

    List<PmCacheDto.Item> selectList(PmCacheDto.Request search);

    PmCacheDto.PageResponse selectPageList(PmCacheDto.Request search);

    int updateSelective(PmCache entity);
}
