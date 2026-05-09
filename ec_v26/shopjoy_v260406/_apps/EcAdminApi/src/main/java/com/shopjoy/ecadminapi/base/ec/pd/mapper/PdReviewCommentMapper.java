package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewCommentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewComment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdReviewCommentMapper {

    PdReviewCommentDto.Item selectById(@Param("id") String id);

    List<PdReviewCommentDto.Item> selectList(PdReviewCommentDto.Request req);

    List<PdReviewCommentDto.Item> selectPageList(PdReviewCommentDto.Request req);

    long selectPageCount(PdReviewCommentDto.Request req);

    int updateSelective(PdReviewComment entity);
}
