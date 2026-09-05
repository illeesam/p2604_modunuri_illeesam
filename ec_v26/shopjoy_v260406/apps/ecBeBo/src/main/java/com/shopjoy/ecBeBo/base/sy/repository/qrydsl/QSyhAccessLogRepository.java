package com.shopjoy.ecBeBo.base.sy.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhAccessLogDto;

import java.util.List;
import java.util.Optional;

/** SyhAccessLog QueryDSL Custom Repository */
public interface QSyhAccessLogRepository {

    /** 단건 상세조회 (코드명/연관명 조인 포함 풀필드) */
    Optional<SyhAccessLogDto.Item> selectById(String id);

    /** 페이지 목록 */
    /** 대량 export 용 목록조회 — pageNo/pageSize 지정 시 청크 페이징 */
    List<SyhAccessLogDto.Item> selectList(SyhAccessLogDto.Request search);
    BasePage<SyhAccessLogDto.Item> selectPageData(SyhAccessLogDto.Request search);
}
