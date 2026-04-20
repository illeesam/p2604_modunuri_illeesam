package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogFileDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogFile;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface CmBlogFileMapper {

    CmBlogFileDto selectById(@Param("id") String id);

    List<CmBlogFileDto> selectList(@Param("p") Map<String, Object> p);

    List<CmBlogFileDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(CmBlogFile entity);
}
