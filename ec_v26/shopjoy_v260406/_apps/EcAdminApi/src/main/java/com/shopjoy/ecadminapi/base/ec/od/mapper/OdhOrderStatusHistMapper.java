package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderStatusHist;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;
@Mapper
public interface OdhOrderStatusHistMapper {

    OdhOrderStatusHistDto.Item selectById(@Param("id") String id);

    List<OdhOrderStatusHistDto.Item> selectList(Map<String, Object> p);

    List<OdhOrderStatusHistDto.Item> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(OdhOrderStatusHist entity);
}
