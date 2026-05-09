package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemChgHist;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;
@Mapper
public interface OdhClaimItemChgHistMapper {

    OdhClaimItemChgHistDto.Item selectById(@Param("id") String id);

    List<OdhClaimItemChgHistDto.Item> selectList(Map<String, Object> p);

    List<OdhClaimItemChgHistDto.Item> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(OdhClaimItemChgHist entity);
}
