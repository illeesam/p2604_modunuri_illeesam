package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBatchDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/** SyBatch QueryDSL Custom Repository */
public interface QSyBatchRepository {
    Optional<SyBatchDto.Item> selectById(String batchId);

    /** 스케줄러 부팅/재로드용 — 관리 엔티티 그대로 반환(SchBatchJobRegistry.register(SyBatch) 시그니처가 엔티티를 요구, DTO selectList 와 다른 반환타입).
     *  base 의 findByBatchStatusCd 대체 */
    List<SyBatch> selectListByBatchStatusCd(String batchStatusCd);

    /** UNIQUE(batch_code) 단건 조회 — 관리 엔티티 그대로 반환(배치 즉시실행 등에서 엔티티 필요).
     *  base 의 findByBatchCode 대체 */
    Optional<SyBatch> selectByBatchCode(String batchCode);
    List<SyBatchDto.Item> selectList(SyBatchDto.Request search);
    BasePage<SyBatchDto.Item> selectPageData(SyBatchDto.Request search);
    int updateSelective(SyBatch entity);
    /** 표시경로 노드별 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL).
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    List<Map<String, Object>> selectPathTreeBatchCnts(SyBatchDto.Request search);
}
