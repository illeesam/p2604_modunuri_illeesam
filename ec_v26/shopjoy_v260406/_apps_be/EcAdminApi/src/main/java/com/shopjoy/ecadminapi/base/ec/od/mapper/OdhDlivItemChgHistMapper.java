package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivItemChgHist;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;
@Mapper
public interface OdhDlivItemChgHistMapper {

    OdhDlivItemChgHistDto.Item selectById(@Param("id") String id);

    List<OdhDlivItemChgHistDto.Item> selectList(Map<String, Object> p);

    List<OdhDlivItemChgHistDto.Item> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(OdhDlivItemChgHist entity);
}
