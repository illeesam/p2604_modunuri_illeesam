package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdTag;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdTagMapper {

    PdTagDto.Item selectById(@Param("id") String id);

    List<PdTagDto.Item> selectList(PdTagDto.Request req);

    List<PdTagDto.Item> selectPageList(PdTagDto.Request req);

    long selectPageCount(PdTagDto.Request req);

    int updateSelective(PdTag entity);
}
