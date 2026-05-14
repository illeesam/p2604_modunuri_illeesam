package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserTokenLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserTokenLog;

import java.util.List;
import java.util.Optional;

/** SyhUserTokenLog QueryDSL Custom Repository */
public interface QSyhUserTokenLogRepository {

    /** 단건 조회 */
    Optional<SyhUserTokenLogDto.Item> selectById(String id);

    /** 전체 목록 */
    List<SyhUserTokenLogDto.Item> selectList(SyhUserTokenLogDto.Request search);

    /** 페이지 목록 */
    SyhUserTokenLogDto.PageResponse selectPageList(SyhUserTokenLogDto.Request search);

    int updateSelective(SyhUserTokenLog entity);
}
