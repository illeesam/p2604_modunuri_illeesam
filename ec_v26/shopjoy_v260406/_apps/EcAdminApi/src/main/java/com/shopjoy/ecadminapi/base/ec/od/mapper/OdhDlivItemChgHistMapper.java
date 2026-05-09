package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivItemChgHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdhDlivItemChgHistMapper {

    OdhDlivItemChgHistDto.Item selectById(@Param("id") String id);

    List<OdhDlivItemChgHistDto.Item> selectList(OdhDlivItemChgHistDto.Request req);

    List<OdhDlivItemChgHistDto.Item> selectPageList(OdhDlivItemChgHistDto.Request req);

    long selectPageCount(OdhDlivItemChgHistDto.Request req);

    int updateSelective(OdhDlivItemChgHist entity);
}
