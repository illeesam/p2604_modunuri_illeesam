package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendMsgLog;

import java.util.List;
import java.util.Optional;

/** SyhSendMsgLog QueryDSL Custom Repository */
public interface QSyhSendMsgLogRepository {

    /** 단건 조회 */
    Optional<SyhSendMsgLogDto.Item> selectById(String id);

    /** 전체 목록 */
    List<SyhSendMsgLogDto.Item> selectList(SyhSendMsgLogDto.Request search);

    /** 페이지 목록 */
    BasePage<SyhSendMsgLogDto.Item> selectPageData(SyhSendMsgLogDto.Request search);

    int updateSelective(SyhSendMsgLog entity);

    /** 재발송 대상 — FAILED 이고 sendDate 가 threshold 이전 (mutate+save 필요, 관리 엔티티 그대로 반환).
     *  base 의 findFailedBefore 대체 (2026-08-27) */
    List<SyhSendMsgLog> selectFailedBefore(java.time.LocalDateTime threshold);
}
