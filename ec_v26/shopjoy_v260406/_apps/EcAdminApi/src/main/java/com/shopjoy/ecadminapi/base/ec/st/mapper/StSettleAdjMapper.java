package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleAdj;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface StSettleAdjMapper {

    StSettleAdjDto selectById(@Param("id") String id);

    List<StSettleAdjDto> selectList(@Param("p") Map<String, Object> p);

    List<StSettleAdjDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(StSettleAdj entity);
}
