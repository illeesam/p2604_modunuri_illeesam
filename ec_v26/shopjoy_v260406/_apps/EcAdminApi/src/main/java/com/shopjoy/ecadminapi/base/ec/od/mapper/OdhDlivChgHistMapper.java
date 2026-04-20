package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivChgHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface OdhDlivChgHistMapper {

    OdhDlivChgHistDto selectById(@Param("id") String id);

    List<OdhDlivChgHistDto> selectList(@Param("p") Map<String, Object> p);

    List<OdhDlivChgHistDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(OdhDlivChgHist entity);
}
