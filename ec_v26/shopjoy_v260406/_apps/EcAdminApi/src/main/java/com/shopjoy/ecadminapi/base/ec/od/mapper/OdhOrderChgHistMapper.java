package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderChgHist;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;
@Mapper
public interface OdhOrderChgHistMapper {

    OdhOrderChgHistDto.Item selectById(@Param("id") String id);

    List<OdhOrderChgHistDto.Item> selectList(Map<String, Object> p);

    List<OdhOrderChgHistDto.Item> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(OdhOrderChgHist entity);
}
