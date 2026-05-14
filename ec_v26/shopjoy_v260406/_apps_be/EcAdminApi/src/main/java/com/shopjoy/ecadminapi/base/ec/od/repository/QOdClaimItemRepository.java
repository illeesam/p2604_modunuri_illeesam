package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaimItem;

import java.util.List;
import java.util.Optional;

/** OdClaimItem QueryDSL Custom Repository */
public interface QOdClaimItemRepository {

    Optional<OdClaimItemDto.Item> selectById(String claimItemId);

    List<OdClaimItemDto.Item> selectList(OdClaimItemDto.Request search);

    OdClaimItemDto.PageResponse selectPageList(OdClaimItemDto.Request search);

    int updateSelective(OdClaimItem entity);
}
