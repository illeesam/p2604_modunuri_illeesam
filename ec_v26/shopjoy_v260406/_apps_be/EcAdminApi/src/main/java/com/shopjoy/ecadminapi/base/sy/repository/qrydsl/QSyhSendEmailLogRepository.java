package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
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
    BasePage<SyhSendEmailLogDto.Item> selectPageData(SyhSendEmailLogDto.Request search);

    int updateSelective(SyhSendEmailLog entity);

    /** 재발송 대상 — FAILED 이고 sendDate 가 threshold 이전 (mutate+save 필요, 관리 엔티티 그대로 반환).
     *  base 의 findFailedBefore 대체 (2026-08-27) */
    List<SyhSendEmailLog> selectFailedBefore(java.time.LocalDateTime threshold);
}
