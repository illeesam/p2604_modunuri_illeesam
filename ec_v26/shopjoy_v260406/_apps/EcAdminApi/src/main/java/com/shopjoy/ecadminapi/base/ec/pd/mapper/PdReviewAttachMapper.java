package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewAttachDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewAttach;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdReviewAttachMapper {

    PdReviewAttachDto.Item selectById(@Param("id") String id);

    List<PdReviewAttachDto.Item> selectList(PdReviewAttachDto.Request req);

    List<PdReviewAttachDto.Item> selectPageList(PdReviewAttachDto.Request req);

    long selectPageCount(PdReviewAttachDto.Request req);

    int updateSelective(PdReviewAttach entity);
}
