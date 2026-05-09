package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettle;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface StSettleMapper {

    StSettleDto.Item selectById(@Param("id") String id);

    List<StSettleDto.Item> selectList(StSettleDto.Request req);

    List<StSettleDto.Item> selectPageList(StSettleDto.Request req);

    long selectPageCount(StSettleDto.Request req);

    int updateSelective(StSettle entity);
}
