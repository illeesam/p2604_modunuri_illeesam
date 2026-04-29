package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherLineDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucherLine;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface StErpVoucherLineMapper {

    StErpVoucherLineDto selectById(@Param("id") String id);

    List<StErpVoucherLineDto> selectList(Map<String, Object> p);

    List<StErpVoucherLineDto> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(StErpVoucherLine entity);
}
