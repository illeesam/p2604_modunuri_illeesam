package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemChgHist;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;
@Mapper
public interface OdhOrderItemChgHistMapper {

    OdhOrderItemChgHistDto.Item selectById(@Param("id") String id);

    List<OdhOrderItemChgHistDto.Item> selectList(Map<String, Object> p);

    List<OdhOrderItemChgHistDto.Item> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(OdhOrderItemChgHist entity);
}
