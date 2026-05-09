package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPay;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdPayMapper {

    OdPayDto.Item selectById(@Param("id") String id);

    List<OdPayDto.Item> selectList(OdPayDto.Request req);

    List<OdPayDto.Item> selectPageList(OdPayDto.Request req);

    long selectPageCount(OdPayDto.Request req);

    int updateSelective(OdPay entity);
}
