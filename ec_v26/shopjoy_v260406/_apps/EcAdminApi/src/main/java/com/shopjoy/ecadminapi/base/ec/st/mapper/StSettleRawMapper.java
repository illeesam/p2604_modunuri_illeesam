package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleRawDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleRaw;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface StSettleRawMapper {

    StSettleRawDto.Item selectById(@Param("id") String id);

    List<StSettleRawDto.Item> selectList(StSettleRawDto.Request req);

    List<StSettleRawDto.Item> selectPageList(StSettleRawDto.Request req);

    long selectPageCount(StSettleRawDto.Request req);

    int updateSelective(StSettleRaw entity);
}
