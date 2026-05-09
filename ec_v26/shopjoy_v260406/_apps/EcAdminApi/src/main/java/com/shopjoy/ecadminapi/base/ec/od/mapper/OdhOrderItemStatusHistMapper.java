package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemStatusHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdhOrderItemStatusHistMapper {

    OdhOrderItemStatusHistDto.Item selectById(@Param("id") String id);

    List<OdhOrderItemStatusHistDto.Item> selectList(OdhOrderItemStatusHistDto.Request req);

    List<OdhOrderItemStatusHistDto.Item> selectPageList(OdhOrderItemStatusHistDto.Request req);

    long selectPageCount(OdhOrderItemStatusHistDto.Request req);

    int updateSelective(OdhOrderItemStatusHist entity);
}
