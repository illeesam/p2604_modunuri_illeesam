package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOptItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdProdOptItemMapper {

    PdProdOptItemDto.Item selectById(@Param("id") String id);

    List<PdProdOptItemDto.Item> selectList(PdProdOptItemDto.Request req);

    List<PdProdOptItemDto.Item> selectPageList(PdProdOptItemDto.Request req);

    long selectPageCount(PdProdOptItemDto.Request req);

    int updateSelective(PdProdOptItem entity);
}
