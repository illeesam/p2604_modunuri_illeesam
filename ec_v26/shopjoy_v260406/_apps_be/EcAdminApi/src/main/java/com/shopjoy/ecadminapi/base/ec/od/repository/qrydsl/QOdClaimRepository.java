package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;

import java.util.List;
import java.util.Optional;

/** OdClaim QueryDSL Custom Repository */
public interface QOdClaimRepository {

    Optional<OdClaimDto.Item> selectById(String claimId);

    List<OdClaimDto.Item> selectList(OdClaimDto.Request search);

    BasePage<OdClaimDto.Item> selectPageData(OdClaimDto.Request search);

    int updateSelective(OdClaim entity);
}
