package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogTagDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogTag;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface CmBlogTagMapper {

    CmBlogTagDto selectById(@Param("id") String id);

    List<CmBlogTagDto> selectList(@Param("p") Map<String, Object> p);

    List<CmBlogTagDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(CmBlogTag entity);
}
