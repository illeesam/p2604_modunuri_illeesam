package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefund;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdRefundMapper {

    OdRefundDto.Item selectById(@Param("id") String id);

    List<OdRefundDto.Item> selectList(OdRefundDto.Request req);

    List<OdRefundDto.Item> selectPageList(OdRefundDto.Request req);

    long selectPageCount(OdRefundDto.Request req);

    int updateSelective(OdRefund entity);
}
