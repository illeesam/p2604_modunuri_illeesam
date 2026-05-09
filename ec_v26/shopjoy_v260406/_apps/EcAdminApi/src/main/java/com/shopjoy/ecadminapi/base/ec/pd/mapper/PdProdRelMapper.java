package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdRelDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdRel;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdProdRelMapper {

    PdProdRelDto.Item selectById(@Param("id") String id);

    List<PdProdRelDto.Item> selectList(PdProdRelDto.Request req);

    List<PdProdRelDto.Item> selectPageList(PdProdRelDto.Request req);

    long selectPageCount(PdProdRelDto.Request req);

    int updateSelective(PdProdRel entity);
}
