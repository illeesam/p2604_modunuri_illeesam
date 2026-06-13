package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessErrorLogDto;

import java.util.Optional;

/** SyhAccessErrorLog QueryDSL Custom Repository */
public interface QSyhAccessErrorLogRepository {

    /** 단건 상세조회 (코드명/연관명 조인 포함 풀필드) */
    Optional<SyhAccessErrorLogDto.Item> selectById(String id);

    /** 페이지 목록 */
    SyhAccessErrorLogDto.PageResponse selectPageData(SyhAccessErrorLogDto.Request search);
}
