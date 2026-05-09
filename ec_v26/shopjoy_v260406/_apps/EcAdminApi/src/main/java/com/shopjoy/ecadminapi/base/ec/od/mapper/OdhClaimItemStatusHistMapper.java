package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemStatusHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdhClaimItemStatusHistMapper {

    OdhClaimItemStatusHistDto.Item selectById(@Param("id") String id);

    List<OdhClaimItemStatusHistDto.Item> selectList(OdhClaimItemStatusHistDto.Request req);

    List<OdhClaimItemStatusHistDto.Item> selectPageList(OdhClaimItemStatusHistDto.Request req);

    long selectPageCount(OdhClaimItemStatusHistDto.Request req);

    int updateSelective(OdhClaimItemStatusHist entity);
}
