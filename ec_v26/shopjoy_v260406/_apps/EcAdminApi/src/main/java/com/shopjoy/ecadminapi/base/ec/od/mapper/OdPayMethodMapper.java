package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPayMethod;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdPayMethodMapper {

    OdPayMethodDto.Item selectById(@Param("id") String id);

    List<OdPayMethodDto.Item> selectList(OdPayMethodDto.Request req);

    List<OdPayMethodDto.Item> selectPageList(OdPayMethodDto.Request req);

    long selectPageCount(OdPayMethodDto.Request req);

    int updateSelective(OdPayMethod entity);
}
