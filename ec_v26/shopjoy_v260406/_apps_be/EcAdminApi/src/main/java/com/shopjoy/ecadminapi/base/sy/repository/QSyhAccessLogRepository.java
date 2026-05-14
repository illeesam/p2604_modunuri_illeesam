package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessLogDto;

/** SyhAccessLog QueryDSL Custom Repository */
public interface QSyhAccessLogRepository {

    /** 페이지 목록 */
    SyhAccessLogDto.PageResponse selectPageList(SyhAccessLogDto.Request search);
}
