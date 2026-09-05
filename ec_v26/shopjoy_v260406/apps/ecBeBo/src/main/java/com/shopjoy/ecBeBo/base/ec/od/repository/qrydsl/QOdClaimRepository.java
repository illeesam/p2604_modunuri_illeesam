package com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdClaim;

import java.util.List;
import java.util.Optional;

/** OdClaim QueryDSL Custom Repository */
public interface QOdClaimRepository {

    Optional<OdClaimDto.Item> selectById(String claimId);

    List<OdClaimDto.Item> selectList(OdClaimDto.Request search);

    BasePage<OdClaimDto.Item> selectPageData(OdClaimDto.Request search);

    int updateSelective(OdClaim entity);

    /** CANCEL/RETURN 클레임 중 COMPLT 상태이고 철회되지 않은 건 (환불 자동 COMPLT 대상).
     *  claimCancelYn IS NULL OR &lt;&gt; 'Y' — AND 안에 OR 그룹이 있어 Query Method 로 표현 불가 → QueryDSL */
    List<OdClaim> selectCompltCancelReturnClaims(List<String> claimTypeCds, String claimStatusCd);
}
