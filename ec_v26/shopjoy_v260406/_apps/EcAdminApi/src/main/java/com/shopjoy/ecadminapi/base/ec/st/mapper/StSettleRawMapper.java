package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleRawDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleRaw;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;
@Mapper
public interface StSettleRawMapper {

    StSettleRawDto.Item selectById(@Param("id") String id);

    List<StSettleRawDto.Item> selectList(Map<String, Object> p);

    List<StSettleRawDto.Item> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(StSettleRaw entity);
}
