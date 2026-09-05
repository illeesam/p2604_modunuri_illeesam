package com.shopjoy.ecBeBo.base.sy.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhApiLogDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyhApiLog;

import java.util.List;
import java.util.Optional;

/** SyhApiLog QueryDSL Custom Repository */
public interface QSyhApiLogRepository {

    /** 단건 조회 */
    Optional<SyhApiLogDto.Item> selectById(String id);

    /** 전체 목록 */
    List<SyhApiLogDto.Item> selectList(SyhApiLogDto.Request search);

    /** 페이지 목록 */
    BasePage<SyhApiLogDto.Item> selectPageData(SyhApiLogDto.Request search);

    int updateSelective(SyhApiLog entity);
}
