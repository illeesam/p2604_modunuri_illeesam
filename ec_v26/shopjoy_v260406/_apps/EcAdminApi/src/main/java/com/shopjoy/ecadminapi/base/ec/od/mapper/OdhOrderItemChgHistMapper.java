package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemChgHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface OdhOrderItemChgHistMapper {

    OdhOrderItemChgHistDto selectById(@Param("id") String id);

    List<OdhOrderItemChgHistDto> selectList(@Param("p") Map<String, Object> p);

    List<OdhOrderItemChgHistDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(OdhOrderItemChgHist entity);
}
