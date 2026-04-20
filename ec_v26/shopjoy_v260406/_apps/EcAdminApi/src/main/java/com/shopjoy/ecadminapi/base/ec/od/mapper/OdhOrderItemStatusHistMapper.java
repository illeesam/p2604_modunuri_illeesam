package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemStatusHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface OdhOrderItemStatusHistMapper {

    OdhOrderItemStatusHistDto selectById(@Param("id") String id);

    List<OdhOrderItemStatusHistDto> selectList(@Param("p") Map<String, Object> p);

    List<OdhOrderItemStatusHistDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(OdhOrderItemStatusHist entity);
}
