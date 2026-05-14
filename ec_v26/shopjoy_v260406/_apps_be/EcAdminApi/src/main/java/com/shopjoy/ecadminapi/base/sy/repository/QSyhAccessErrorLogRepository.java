package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessErrorLogDto;

/** SyhAccessErrorLog QueryDSL Custom Repository */
public interface QSyhAccessErrorLogRepository {

    /** 페이지 목록 */
    SyhAccessErrorLogDto.PageResponse selectPageList(SyhAccessErrorLogDto.Request search);
}
