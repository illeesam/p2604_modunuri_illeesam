package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleAdj;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface StSettleAdjMapper {

    StSettleAdjDto.Item selectById(@Param("id") String id);

    List<StSettleAdjDto.Item> selectList(StSettleAdjDto.Request req);

    List<StSettleAdjDto.Item> selectPageList(StSettleAdjDto.Request req);

    long selectPageCount(StSettleAdjDto.Request req);

    int updateSelective(StSettleAdj entity);
}
