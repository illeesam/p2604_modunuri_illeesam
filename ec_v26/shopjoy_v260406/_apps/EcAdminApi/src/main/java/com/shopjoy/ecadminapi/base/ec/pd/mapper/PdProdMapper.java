package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdProdMapper {

    PdProdDto.Item selectById(@Param("id") String id);

    List<PdProdDto.Item> selectList(PdProdDto.Request req);

    List<PdProdDto.Item> selectPageList(PdProdDto.Request req);

    long selectPageCount(PdProdDto.Request req);

    int updateSelective(PdProd entity);
}
