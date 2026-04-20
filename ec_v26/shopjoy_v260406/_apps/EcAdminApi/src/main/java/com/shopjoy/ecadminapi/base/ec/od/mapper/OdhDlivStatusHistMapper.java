package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivStatusHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface OdhDlivStatusHistMapper {

    OdhDlivStatusHistDto selectById(@Param("id") String id);

    List<OdhDlivStatusHistDto> selectList(@Param("p") Map<String, Object> p);

    List<OdhDlivStatusHistDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(OdhDlivStatusHist entity);
}
