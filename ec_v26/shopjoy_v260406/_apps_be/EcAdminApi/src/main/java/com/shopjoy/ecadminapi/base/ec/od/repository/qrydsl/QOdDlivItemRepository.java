package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDlivItem;

import java.util.List;
import java.util.Optional;

/** OdDlivItem QueryDSL Custom Repository */
public interface QOdDlivItemRepository {

    Optional<OdDlivItemDto.Item> selectById(String dlivItemId);

    /** 배송상태 동기화 배치용 — 관리 엔티티 그대로 반환(상태변경 후 save 필요, DTO selectList 와 다른 반환타입).
     *  base 의 findByDlivId 대체 */
    List<OdDlivItem> selectListByDlivId(String dlivId);

    List<OdDlivItemDto.Item> selectList(OdDlivItemDto.Request search);

    BasePage<OdDlivItemDto.Item> selectPageData(OdDlivItemDto.Request search);

    int updateSelective(OdDlivItem entity);
}
