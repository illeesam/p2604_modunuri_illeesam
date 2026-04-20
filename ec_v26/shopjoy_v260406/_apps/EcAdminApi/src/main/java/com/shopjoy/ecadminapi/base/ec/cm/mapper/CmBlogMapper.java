package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface CmBlogMapper {

    CmBlogDto selectById(@Param("id") String id);

    List<CmBlogDto> selectList(@Param("p") Map<String, Object> p);

    List<CmBlogDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(CmBlog entity);
}
