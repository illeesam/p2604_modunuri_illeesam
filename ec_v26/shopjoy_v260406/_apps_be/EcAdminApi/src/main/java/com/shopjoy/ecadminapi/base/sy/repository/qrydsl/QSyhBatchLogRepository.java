package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhBatchLog;

import java.util.List;
import java.util.Optional;

/** SyhBatchLog QueryDSL Custom Repository */
public interface QSyhBatchLogRepository {

    /** 단건 조회 */
    Optional<SyhBatchLogDto.Item> selectById(String id);

    /** 전체 목록 */
    List<SyhBatchLogDto.Item> selectList(SyhBatchLogDto.Request search);

    /** 페이지 목록 */
    SyhBatchLogDto.PageResponse selectPageList(SyhBatchLogDto.Request search);

    int updateSelective(SyhBatchLog entity);
}
