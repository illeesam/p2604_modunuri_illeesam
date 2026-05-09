package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleEtcAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleEtcAdj;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;
@Mapper
public interface StSettleEtcAdjMapper {

    StSettleEtcAdjDto.Item selectById(@Param("id") String id);

    List<StSettleEtcAdjDto.Item> selectList(Map<String, Object> p);

    List<StSettleEtcAdjDto.Item> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(StSettleEtcAdj entity);
}
