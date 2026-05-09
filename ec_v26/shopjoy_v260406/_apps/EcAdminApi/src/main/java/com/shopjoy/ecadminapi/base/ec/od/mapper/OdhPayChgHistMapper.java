package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayChgHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdhPayChgHistMapper {

    OdhPayChgHistDto.Item selectById(@Param("id") String id);

    List<OdhPayChgHistDto.Item> selectList(OdhPayChgHistDto.Request req);

    List<OdhPayChgHistDto.Item> selectPageList(OdhPayChgHistDto.Request req);

    long selectPageCount(OdhPayChgHistDto.Request req);

    int updateSelective(OdhPayChgHist entity);
}
