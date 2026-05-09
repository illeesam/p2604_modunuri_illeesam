package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimChgHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdhClaimChgHistMapper {

    OdhClaimChgHistDto.Item selectById(@Param("id") String id);

    List<OdhClaimChgHistDto.Item> selectList(OdhClaimChgHistDto.Request req);

    List<OdhClaimChgHistDto.Item> selectPageList(OdhClaimChgHistDto.Request req);

    long selectPageCount(OdhClaimChgHistDto.Request req);

    int updateSelective(OdhClaimChgHist entity);
}
