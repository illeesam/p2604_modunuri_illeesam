package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherLineDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucherLine;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface StErpVoucherLineMapper {

    StErpVoucherLineDto.Item selectById(@Param("id") String id);

    List<StErpVoucherLineDto.Item> selectList(StErpVoucherLineDto.Request req);

    List<StErpVoucherLineDto.Item> selectPageList(StErpVoucherLineDto.Request req);

    long selectPageCount(StErpVoucherLineDto.Request req);

    int updateSelective(StErpVoucherLine entity);
}
