package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaimItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdClaimItemMapper {

    OdClaimItemDto.Item selectById(@Param("id") String id);

    List<OdClaimItemDto.Item> selectList(OdClaimItemDto.Request req);

    List<OdClaimItemDto.Item> selectPageList(OdClaimItemDto.Request req);

    long selectPageCount(OdClaimItemDto.Request req);

    int updateSelective(OdClaimItem entity);
}
