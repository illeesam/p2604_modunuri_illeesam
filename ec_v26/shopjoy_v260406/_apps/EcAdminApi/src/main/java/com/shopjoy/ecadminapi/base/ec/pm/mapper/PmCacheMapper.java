package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCache;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmCacheMapper {

    PmCacheDto.Item selectById(@Param("id") String id);

    List<PmCacheDto.Item> selectList(PmCacheDto.Request req);

    List<PmCacheDto.Item> selectPageList(PmCacheDto.Request req);

    long selectPageCount(PmCacheDto.Request req);

    int updateSelective(PmCache entity);
}
