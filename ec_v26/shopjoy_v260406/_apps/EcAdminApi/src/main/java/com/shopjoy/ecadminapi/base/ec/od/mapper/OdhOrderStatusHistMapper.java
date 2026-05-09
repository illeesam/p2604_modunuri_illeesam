package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderStatusHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdhOrderStatusHistMapper {

    OdhOrderStatusHistDto.Item selectById(@Param("id") String id);

    List<OdhOrderStatusHistDto.Item> selectList(OdhOrderStatusHistDto.Request req);

    List<OdhOrderStatusHistDto.Item> selectPageList(OdhOrderStatusHistDto.Request req);

    long selectPageCount(OdhOrderStatusHistDto.Request req);

    int updateSelective(OdhOrderStatusHist entity);
}
