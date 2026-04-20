package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogCateDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogCate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface CmBlogCateMapper {

    CmBlogCateDto selectById(@Param("id") String id);

    List<CmBlogCateDto> selectList(@Param("p") Map<String, Object> p);

    List<CmBlogCateDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(CmBlogCate entity);
}
