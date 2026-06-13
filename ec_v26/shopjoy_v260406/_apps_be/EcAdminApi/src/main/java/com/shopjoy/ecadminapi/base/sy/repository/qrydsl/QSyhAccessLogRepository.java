package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessLogDto;

import java.util.Optional;

/** SyhAccessLog QueryDSL Custom Repository */
public interface QSyhAccessLogRepository {

    /** 단건 상세조회 (코드명/연관명 조인 포함 풀필드) */
    Optional<SyhAccessLogDto.Item> selectById(String id);

    /** 페이지 목록 */
    SyhAccessLogDto.PageResponse selectPageData(SyhAccessLogDto.Request search);
}
