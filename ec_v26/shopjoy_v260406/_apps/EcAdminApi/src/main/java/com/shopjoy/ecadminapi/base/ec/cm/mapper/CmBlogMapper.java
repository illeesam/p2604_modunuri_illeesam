package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface CmBlogMapper {

    CmBlogDto.Item selectById(@Param("id") String id);

    List<CmBlogDto.Item> selectList(CmBlogDto.Request req);

    List<CmBlogDto.Item> selectPageList(CmBlogDto.Request req);

    long selectPageCount(CmBlogDto.Request req);

    int updateSelective(CmBlog entity);
}
