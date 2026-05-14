package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;

import java.util.List;
import java.util.Optional;

/** OdClaim QueryDSL Custom Repository */
public interface QOdClaimRepository {

    Optional<OdClaimDto.Item> selectById(String claimId);

    List<OdClaimDto.Item> selectList(OdClaimDto.Request search);

    OdClaimDto.PageResponse selectPageList(OdClaimDto.Request search);

    int updateSelective(OdClaim entity);
}
