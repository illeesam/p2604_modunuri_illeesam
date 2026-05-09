package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayStatusHist;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;
@Mapper
public interface OdhPayStatusHistMapper {

    OdhPayStatusHistDto.Item selectById(@Param("id") String id);

    List<OdhPayStatusHistDto.Item> selectList(Map<String, Object> p);

    List<OdhPayStatusHistDto.Item> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(OdhPayStatusHist entity);
}
