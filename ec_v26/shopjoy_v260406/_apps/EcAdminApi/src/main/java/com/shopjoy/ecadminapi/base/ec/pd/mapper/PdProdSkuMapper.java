package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSkuDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSku;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdProdSkuMapper {

    PdProdSkuDto.Item selectById(@Param("id") String id);

    List<PdProdSkuDto.Item> selectList(PdProdSkuDto.Request req);

    List<PdProdSkuDto.Item> selectPageList(PdProdSkuDto.Request req);

    long selectPageCount(PdProdSkuDto.Request req);

    int updateSelective(PdProdSku entity);
}
