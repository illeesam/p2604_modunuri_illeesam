package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayStatusHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdhPayStatusHistMapper {

    OdhPayStatusHistDto.Item selectById(@Param("id") String id);

    List<OdhPayStatusHistDto.Item> selectList(OdhPayStatusHistDto.Request req);

    List<OdhPayStatusHistDto.Item> selectPageList(OdhPayStatusHistDto.Request req);

    long selectPageCount(OdhPayStatusHistDto.Request req);

    int updateSelective(OdhPayStatusHist entity);
}
