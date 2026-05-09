package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivChgHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdhDlivChgHistMapper {

    OdhDlivChgHistDto.Item selectById(@Param("id") String id);

    List<OdhDlivChgHistDto.Item> selectList(OdhDlivChgHistDto.Request req);

    List<OdhDlivChgHistDto.Item> selectPageList(OdhDlivChgHistDto.Request req);

    long selectPageCount(OdhDlivChgHistDto.Request req);

    int updateSelective(OdhDlivChgHist entity);
}
