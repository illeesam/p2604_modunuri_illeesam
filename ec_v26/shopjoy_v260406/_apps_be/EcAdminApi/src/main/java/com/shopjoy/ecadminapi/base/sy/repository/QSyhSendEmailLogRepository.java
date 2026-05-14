package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendEmailLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendEmailLog;

import java.util.List;
import java.util.Optional;

/** SyhSendEmailLog QueryDSL Custom Repository */
public interface QSyhSendEmailLogRepository {

    /** 단건 조회 */
    Optional<SyhSendEmailLogDto.Item> selectById(String id);

    /** 전체 목록 */
    List<SyhSendEmailLogDto.Item> selectList(SyhSendEmailLogDto.Request search);

    /** 페이지 목록 */
    SyhSendEmailLogDto.PageResponse selectPageList(SyhSendEmailLogDto.Request search);

    int updateSelective(SyhSendEmailLog entity);
}
