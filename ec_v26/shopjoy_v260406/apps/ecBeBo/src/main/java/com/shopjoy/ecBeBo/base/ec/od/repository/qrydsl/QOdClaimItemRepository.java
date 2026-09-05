package com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdClaimItemDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdClaimItem;

import java.util.List;
import java.util.Optional;

/** OdClaimItem QueryDSL Custom Repository */
public interface QOdClaimItemRepository {

    Optional<OdClaimItemDto.Item> selectById(String claimItemId);

    List<OdClaimItemDto.Item> selectList(OdClaimItemDto.Request search);

    BasePage<OdClaimItemDto.Item> selectPageData(OdClaimItemDto.Request search);

    int updateSelective(OdClaimItem entity);
}
