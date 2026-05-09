package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbLikeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbLike;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface MbLikeMapper {

    MbLikeDto.Item selectById(@Param("id") String id);

    List<MbLikeDto.Item> selectList(MbLikeDto.Request req);

    List<MbLikeDto.Item> selectPageList(MbLikeDto.Request req);

    long selectPageCount(MbLikeDto.Request req);

    int updateSelective(MbLike entity);
}
