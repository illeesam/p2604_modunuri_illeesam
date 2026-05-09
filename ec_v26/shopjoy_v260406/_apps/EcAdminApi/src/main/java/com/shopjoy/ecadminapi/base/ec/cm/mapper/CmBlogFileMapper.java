package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogFileDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogFile;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface CmBlogFileMapper {

    CmBlogFileDto.Item selectById(@Param("id") String id);

    List<CmBlogFileDto.Item> selectList(CmBlogFileDto.Request req);

    List<CmBlogFileDto.Item> selectPageList(CmBlogFileDto.Request req);

    long selectPageCount(CmBlogFileDto.Request req);

    int updateSelective(CmBlogFile entity);
}
