package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemStatusHist;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;
@Mapper
public interface OdhClaimItemStatusHistMapper {

    OdhClaimItemStatusHistDto.Item selectById(@Param("id") String id);

    List<OdhClaimItemStatusHistDto.Item> selectList(Map<String, Object> p);

    List<OdhClaimItemStatusHistDto.Item> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(OdhClaimItemStatusHist entity);
}
