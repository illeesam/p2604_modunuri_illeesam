package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaimItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface OdClaimItemMapper {

    OdClaimItemDto selectById(@Param("id") String id);

    List<OdClaimItemDto> selectList(@Param("p") Map<String, Object> p);

    List<OdClaimItemDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(OdClaimItem entity);
}
