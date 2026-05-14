package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserLoginLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserLoginLog;

import java.util.List;
import java.util.Optional;

/** SyhUserLoginLog QueryDSL Custom Repository */
public interface QSyhUserLoginLogRepository {

    /** 단건 조회 */
    Optional<SyhUserLoginLogDto.Item> selectById(String id);

    /** 전체 목록 */
    List<SyhUserLoginLogDto.Item> selectList(SyhUserLoginLogDto.Request search);

    /** 페이지 목록 */
    SyhUserLoginLogDto.PageResponse selectPageList(SyhUserLoginLogDto.Request search);

    int updateSelective(SyhUserLoginLog entity);
}
