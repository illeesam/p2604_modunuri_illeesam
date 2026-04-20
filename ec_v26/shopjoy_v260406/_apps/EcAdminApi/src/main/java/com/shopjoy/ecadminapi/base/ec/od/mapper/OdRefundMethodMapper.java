package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefundMethod;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface OdRefundMethodMapper {

    OdRefundMethodDto selectById(@Param("id") String id);

    List<OdRefundMethodDto> selectList(@Param("p") Map<String, Object> p);

    List<OdRefundMethodDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(OdRefundMethod entity);
}
