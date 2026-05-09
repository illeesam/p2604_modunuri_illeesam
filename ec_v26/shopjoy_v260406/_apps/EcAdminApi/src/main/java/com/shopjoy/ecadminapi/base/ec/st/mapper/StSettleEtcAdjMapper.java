package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleEtcAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleEtcAdj;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface StSettleEtcAdjMapper {

    StSettleEtcAdjDto.Item selectById(@Param("id") String id);

    List<StSettleEtcAdjDto.Item> selectList(StSettleEtcAdjDto.Request req);

    List<StSettleEtcAdjDto.Item> selectPageList(StSettleEtcAdjDto.Request req);

    long selectPageCount(StSettleEtcAdjDto.Request req);

    int updateSelective(StSettleEtcAdj entity);
}
