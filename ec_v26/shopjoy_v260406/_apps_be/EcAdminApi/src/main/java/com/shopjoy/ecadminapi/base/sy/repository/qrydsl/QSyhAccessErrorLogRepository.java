package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessErrorLogDto;

import java.util.List;
import java.util.Optional;

/** SyhAccessErrorLog QueryDSL Custom Repository */
public interface QSyhAccessErrorLogRepository {

    /** 단건 상세조회 (코드명/연관명 조인 포함 풀필드) */
    Optional<SyhAccessErrorLogDto.Item> selectById(String id);

    /** 페이지 목록 */
    /** 대량 export 용 목록조회 — pageNo/pageSize 지정 시 청크 페이징 */
    List<SyhAccessErrorLogDto.Item> selectList(SyhAccessErrorLogDto.Request search);
    BasePage<SyhAccessErrorLogDto.Item> selectPageData(SyhAccessErrorLogDto.Request search);
}
