package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettlePayDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettlePay;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface StSettlePayMapper {

    StSettlePayDto.Item selectById(@Param("id") String id);

    List<StSettlePayDto.Item> selectList(StSettlePayDto.Request req);

    List<StSettlePayDto.Item> selectPageList(StSettlePayDto.Request req);

    long selectPageCount(StSettlePayDto.Request req);

    int updateSelective(StSettlePay entity);
}
