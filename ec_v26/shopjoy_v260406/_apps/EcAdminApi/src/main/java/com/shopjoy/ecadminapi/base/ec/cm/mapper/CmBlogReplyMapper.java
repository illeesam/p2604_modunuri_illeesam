package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogReplyDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogReply;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface CmBlogReplyMapper {

    CmBlogReplyDto.Item selectById(@Param("id") String id);

    List<CmBlogReplyDto.Item> selectList(CmBlogReplyDto.Request req);

    List<CmBlogReplyDto.Item> selectPageList(CmBlogReplyDto.Request req);

    long selectPageCount(CmBlogReplyDto.Request req);

    int updateSelective(CmBlogReply entity);
}
