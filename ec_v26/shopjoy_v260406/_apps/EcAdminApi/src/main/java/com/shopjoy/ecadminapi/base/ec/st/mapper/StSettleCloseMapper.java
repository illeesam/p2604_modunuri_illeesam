package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleCloseDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleClose;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface StSettleCloseMapper {

    StSettleCloseDto.Item selectById(@Param("id") String id);

    List<StSettleCloseDto.Item> selectList(StSettleCloseDto.Request req);

    List<StSettleCloseDto.Item> selectPageList(StSettleCloseDto.Request req);

    long selectPageCount(StSettleCloseDto.Request req);

    int updateSelective(StSettleClose entity);
}
