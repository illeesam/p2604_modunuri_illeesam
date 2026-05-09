package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdTag;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdProdTagMapper {

    PdProdTagDto.Item selectById(@Param("id") String id);

    List<PdProdTagDto.Item> selectList(PdProdTagDto.Request req);

    List<PdProdTagDto.Item> selectPageList(PdProdTagDto.Request req);

    long selectPageCount(PdProdTagDto.Request req);

    int updateSelective(PdProdTag entity);
}
