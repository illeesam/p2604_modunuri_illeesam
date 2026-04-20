package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbLikeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbLike;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface MbLikeMapper {

    MbLikeDto selectById(@Param("id") String id);

    List<MbLikeDto> selectList(@Param("p") Map<String, Object> p);

    List<MbLikeDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(MbLike entity);
}
