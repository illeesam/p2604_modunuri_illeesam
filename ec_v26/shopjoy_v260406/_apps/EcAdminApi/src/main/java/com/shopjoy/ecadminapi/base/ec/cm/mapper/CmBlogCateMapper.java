package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogCateDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogCate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface CmBlogCateMapper {

    CmBlogCateDto.Item selectById(@Param("id") String id);

    List<CmBlogCateDto.Item> selectList(CmBlogCateDto.Request req);

    List<CmBlogCateDto.Item> selectPageList(CmBlogCateDto.Request req);

    long selectPageCount(CmBlogCateDto.Request req);

    int updateSelective(CmBlogCate entity);
}
