package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdProdOptMapper {

    PdProdOptDto.Item selectById(@Param("id") String id);

    List<PdProdOptDto.Item> selectList(PdProdOptDto.Request req);

    List<PdProdOptDto.Item> selectPageList(PdProdOptDto.Request req);

    long selectPageCount(PdProdOptDto.Request req);

    int updateSelective(PdProdOpt entity);
}
