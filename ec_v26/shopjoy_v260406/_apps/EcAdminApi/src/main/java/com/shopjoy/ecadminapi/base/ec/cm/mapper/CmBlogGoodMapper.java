package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogGoodDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogGood;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface CmBlogGoodMapper {

    CmBlogGoodDto.Item selectById(@Param("id") String id);

    List<CmBlogGoodDto.Item> selectList(CmBlogGoodDto.Request req);

    List<CmBlogGoodDto.Item> selectPageList(CmBlogGoodDto.Request req);

    long selectPageCount(CmBlogGoodDto.Request req);

    int updateSelective(CmBlogGood entity);
}
