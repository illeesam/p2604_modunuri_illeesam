package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemChgHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdhOrderItemChgHistMapper {

    OdhOrderItemChgHistDto.Item selectById(@Param("id") String id);

    List<OdhOrderItemChgHistDto.Item> selectList(OdhOrderItemChgHistDto.Request req);

    List<OdhOrderItemChgHistDto.Item> selectPageList(OdhOrderItemChgHistDto.Request req);

    long selectPageCount(OdhOrderItemChgHistDto.Request req);

    int updateSelective(OdhOrderItemChgHist entity);
}
