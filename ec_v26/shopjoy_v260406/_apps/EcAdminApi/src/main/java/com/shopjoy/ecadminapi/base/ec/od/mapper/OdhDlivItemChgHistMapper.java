package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivItemChgHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface OdhDlivItemChgHistMapper {

    OdhDlivItemChgHistDto selectById(@Param("id") String id);

    List<OdhDlivItemChgHistDto> selectList(Map<String, Object> p);

    List<OdhDlivItemChgHistDto> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(OdhDlivItemChgHist entity);
}
