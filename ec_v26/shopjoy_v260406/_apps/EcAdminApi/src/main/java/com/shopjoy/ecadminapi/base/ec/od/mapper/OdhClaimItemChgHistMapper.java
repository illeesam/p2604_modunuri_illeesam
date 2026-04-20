package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemChgHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface OdhClaimItemChgHistMapper {

    OdhClaimItemChgHistDto selectById(@Param("id") String id);

    List<OdhClaimItemChgHistDto> selectList(@Param("p") Map<String, Object> p);

    List<OdhClaimItemChgHistDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(OdhClaimItemChgHist entity);
}
