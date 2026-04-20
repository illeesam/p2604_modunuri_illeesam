package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogGoodDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogGood;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface CmBlogGoodMapper {

    CmBlogGoodDto selectById(@Param("id") String id);

    List<CmBlogGoodDto> selectList(@Param("p") Map<String, Object> p);

    List<CmBlogGoodDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(CmBlogGood entity);
}
