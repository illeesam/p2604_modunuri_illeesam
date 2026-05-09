package com.shopjoy.ecadminapi.base.ec.od.mapper;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface OdClaimMapper {

    OdClaimDto.Item selectById(@Param("id") String id);

    List<OdClaimDto.Item> selectList(OdClaimDto.Request req);

    List<OdClaimDto.Item> selectPageList(OdClaimDto.Request req);

    long selectPageCount(OdClaimDto.Request req);

    int updateSelective(OdClaim entity);
}
