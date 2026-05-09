package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderDiscnt;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdOrderDiscntMapper {

    OdOrderDiscntDto.Item selectById(@Param("id") String id);

    List<OdOrderDiscntDto.Item> selectList(OdOrderDiscntDto.Request req);

    List<OdOrderDiscntDto.Item> selectPageList(OdOrderDiscntDto.Request req);

    long selectPageCount(OdOrderDiscntDto.Request req);

    int updateSelective(OdOrderDiscnt entity);
}
