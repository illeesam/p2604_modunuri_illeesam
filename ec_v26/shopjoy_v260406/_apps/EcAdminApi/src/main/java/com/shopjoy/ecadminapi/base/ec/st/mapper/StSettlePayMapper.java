package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettlePayDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettlePay;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface StSettlePayMapper {

    StSettlePayDto selectById(@Param("id") String id);

    List<StSettlePayDto> selectList(@Param("p") Map<String, Object> p);

    List<StSettlePayDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(StSettlePay entity);
}
