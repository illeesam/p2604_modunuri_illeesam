package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSetItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSetItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdProdSetItemMapper {

    PdProdSetItemDto.Item selectById(@Param("id") String id);

    List<PdProdSetItemDto.Item> selectList(PdProdSetItemDto.Request req);

    List<PdProdSetItemDto.Item> selectPageList(PdProdSetItemDto.Request req);

    long selectPageCount(PdProdSetItemDto.Request req);

    int updateSelective(PdProdSetItem entity);
}
