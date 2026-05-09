package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleItemDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface StSettleItemMapper {

    StSettleItemDto.Item selectById(@Param("id") String id);

    List<StSettleItemDto.Item> selectList(StSettleItemDto.Request req);

    List<StSettleItemDto.Item> selectPageList(StSettleItemDto.Request req);

    long selectPageCount(StSettleItemDto.Request req);

    int updateSelective(StSettleItem entity);
}
