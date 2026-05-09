package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleConfigDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface StSettleConfigMapper {

    StSettleConfigDto.Item selectById(@Param("id") String id);

    List<StSettleConfigDto.Item> selectList(StSettleConfigDto.Request req);

    List<StSettleConfigDto.Item> selectPageList(StSettleConfigDto.Request req);

    long selectPageCount(StSettleConfigDto.Request req);

    int updateSelective(StSettleConfig entity);
}
