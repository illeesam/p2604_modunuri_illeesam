package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderChgHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdhOrderChgHistMapper {

    OdhOrderChgHistDto.Item selectById(@Param("id") String id);

    List<OdhOrderChgHistDto.Item> selectList(OdhOrderChgHistDto.Request req);

    List<OdhOrderChgHistDto.Item> selectPageList(OdhOrderChgHistDto.Request req);

    long selectPageCount(OdhOrderChgHistDto.Request req);

    int updateSelective(OdhOrderChgHist entity);
}
