package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdContentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdContent;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdProdContentMapper {

    PdProdContentDto.Item selectById(@Param("id") String id);

    List<PdProdContentDto.Item> selectList(PdProdContentDto.Request req);

    List<PdProdContentDto.Item> selectPageList(PdProdContentDto.Request req);

    long selectPageCount(PdProdContentDto.Request req);

    int updateSelective(PdProdContent entity);
}
