package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdCategoryMapper {

    PdCategoryDto.Item selectById(@Param("id") String id);

    List<PdCategoryDto.Item> selectList(PdCategoryDto.Request req);

    List<PdCategoryDto.Item> selectPageList(PdCategoryDto.Request req);

    long selectPageCount(PdCategoryDto.Request req);

    int updateSelective(PdCategory entity);
}
