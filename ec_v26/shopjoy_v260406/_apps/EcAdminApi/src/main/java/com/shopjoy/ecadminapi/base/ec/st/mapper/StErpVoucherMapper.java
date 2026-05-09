package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucher;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface StErpVoucherMapper {

    StErpVoucherDto.Item selectById(@Param("id") String id);

    List<StErpVoucherDto.Item> selectList(StErpVoucherDto.Request req);

    List<StErpVoucherDto.Item> selectPageList(StErpVoucherDto.Request req);

    long selectPageCount(StErpVoucherDto.Request req);

    int updateSelective(StErpVoucher entity);
}
