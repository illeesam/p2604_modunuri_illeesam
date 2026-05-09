package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdViewLogDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdViewLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdhProdViewLogMapper {

    PdhProdViewLogDto.Item selectById(@Param("id") String id);

    List<PdhProdViewLogDto.Item> selectList(PdhProdViewLogDto.Request req);

    List<PdhProdViewLogDto.Item> selectPageList(PdhProdViewLogDto.Request req);

    long selectPageCount(PdhProdViewLogDto.Request req);

    int updateSelective(PdhProdViewLog entity);
}
