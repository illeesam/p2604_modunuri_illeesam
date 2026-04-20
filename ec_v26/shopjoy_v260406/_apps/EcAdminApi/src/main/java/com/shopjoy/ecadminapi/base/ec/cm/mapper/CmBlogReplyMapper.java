package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogReplyDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogReply;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface CmBlogReplyMapper {

    CmBlogReplyDto selectById(@Param("id") String id);

    List<CmBlogReplyDto> selectList(@Param("p") Map<String, Object> p);

    List<CmBlogReplyDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(CmBlogReply entity);
}
