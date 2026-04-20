package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleConfigDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface StSettleConfigMapper {

    StSettleConfigDto selectById(@Param("id") String id);

    List<StSettleConfigDto> selectList(@Param("p") Map<String, Object> p);

    List<StSettleConfigDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(StSettleConfig entity);
}
