package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPayMethod;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface OdPayMethodMapper {

    OdPayMethodDto selectById(@Param("id") String id);

    List<OdPayMethodDto> selectList(@Param("p") Map<String, Object> p);

    List<OdPayMethodDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(OdPayMethod entity);
}
