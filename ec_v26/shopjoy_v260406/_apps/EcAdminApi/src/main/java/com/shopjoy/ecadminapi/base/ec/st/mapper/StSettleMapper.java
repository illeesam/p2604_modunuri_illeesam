package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettle;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface StSettleMapper {

    StSettleDto selectById(@Param("id") String id);

    List<StSettleDto> selectList(@Param("p") Map<String, Object> p);

    List<StSettleDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(StSettle entity);
}
