package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleEtcAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleEtcAdj;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface StSettleEtcAdjMapper {

    StSettleEtcAdjDto selectById(@Param("id") String id);

    List<StSettleEtcAdjDto> selectList(@Param("p") Map<String, Object> p);

    List<StSettleEtcAdjDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(StSettleEtcAdj entity);
}
