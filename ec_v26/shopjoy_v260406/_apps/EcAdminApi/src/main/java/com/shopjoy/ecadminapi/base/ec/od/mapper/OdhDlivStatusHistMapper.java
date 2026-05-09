package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivStatusHist;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;
@Mapper
public interface OdhDlivStatusHistMapper {

    OdhDlivStatusHistDto.Item selectById(@Param("id") String id);

    List<OdhDlivStatusHistDto.Item> selectList(Map<String, Object> p);

    List<OdhDlivStatusHistDto.Item> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(OdhDlivStatusHist entity);
}
