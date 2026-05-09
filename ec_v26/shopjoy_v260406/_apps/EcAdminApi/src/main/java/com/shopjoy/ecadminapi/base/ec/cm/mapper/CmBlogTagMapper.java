package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogTagDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogTag;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface CmBlogTagMapper {

    CmBlogTagDto.Item selectById(@Param("id") String id);

    List<CmBlogTagDto.Item> selectList(CmBlogTagDto.Request req);

    List<CmBlogTagDto.Item> selectPageList(CmBlogTagDto.Request req);

    long selectPageCount(CmBlogTagDto.Request req);

    int updateSelective(CmBlogTag entity);
}
