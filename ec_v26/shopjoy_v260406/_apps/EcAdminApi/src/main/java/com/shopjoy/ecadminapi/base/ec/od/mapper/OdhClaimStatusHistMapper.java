package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimStatusHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface OdhClaimStatusHistMapper {

    OdhClaimStatusHistDto selectById(@Param("id") String id);

    List<OdhClaimStatusHistDto> selectList(@Param("p") Map<String, Object> p);

    List<OdhClaimStatusHistDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(OdhClaimStatusHist entity);
}
