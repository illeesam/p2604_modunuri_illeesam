package com.shopjoy.ecBeBo.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdhProdViewLogDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdhProdViewLog;

import java.util.List;
import java.util.Optional;

/** PdhProdViewLog QueryDSL Custom Repository */
public interface QPdhProdViewLogRepository {

    /** 단건 조회 */
    Optional<PdhProdViewLogDto.Item> selectById(String id);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<PdhProdViewLogDto.Item> selectList(PdhProdViewLogDto.Request search);

    /** 페이지 목록 */
    BasePage<PdhProdViewLogDto.Item> selectPageData(PdhProdViewLogDto.Request search);

    int updateSelective(PdhProdViewLog entity);
}
