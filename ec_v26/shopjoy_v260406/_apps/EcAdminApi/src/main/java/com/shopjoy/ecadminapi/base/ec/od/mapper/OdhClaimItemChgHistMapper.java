package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemChgHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdhClaimItemChgHistMapper {

    OdhClaimItemChgHistDto.Item selectById(@Param("id") String id);

    List<OdhClaimItemChgHistDto.Item> selectList(OdhClaimItemChgHistDto.Request req);

    List<OdhClaimItemChgHistDto.Item> selectPageList(OdhClaimItemChgHistDto.Request req);

    long selectPageCount(OdhClaimItemChgHistDto.Request req);

    int updateSelective(OdhClaimItemChgHist entity);
}
