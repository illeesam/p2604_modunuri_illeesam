package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivStatusHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdhDlivStatusHistMapper {

    OdhDlivStatusHistDto.Item selectById(@Param("id") String id);

    List<OdhDlivStatusHistDto.Item> selectList(OdhDlivStatusHistDto.Request req);

    List<OdhDlivStatusHistDto.Item> selectPageList(OdhDlivStatusHistDto.Request req);

    long selectPageCount(OdhDlivStatusHistDto.Request req);

    int updateSelective(OdhDlivStatusHist entity);
}
