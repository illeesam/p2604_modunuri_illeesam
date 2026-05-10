package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemStatusHist;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;
@Mapper
public interface OdhOrderItemStatusHistMapper {

    OdhOrderItemStatusHistDto.Item selectById(@Param("id") String id);

    List<OdhOrderItemStatusHistDto.Item> selectList(Map<String, Object> p);

    List<OdhOrderItemStatusHistDto.Item> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(OdhOrderItemStatusHist entity);
}
