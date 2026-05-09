package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimStatusHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdhClaimStatusHistMapper {

    OdhClaimStatusHistDto.Item selectById(@Param("id") String id);

    List<OdhClaimStatusHistDto.Item> selectList(OdhClaimStatusHistDto.Request req);

    List<OdhClaimStatusHistDto.Item> selectPageList(OdhClaimStatusHistDto.Request req);

    long selectPageCount(OdhClaimStatusHistDto.Request req);

    int updateSelective(OdhClaimStatusHist entity);
}
