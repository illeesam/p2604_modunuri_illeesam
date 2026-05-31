package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAlarmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/** SyAlarm QueryDSL Custom Repository */
public interface QSyAlarmRepository {

    /** 단건 조회 */
    Optional<SyAlarmDto.Item> selectById(String alarmId);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<SyAlarmDto.Item> selectList(SyAlarmDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    SyAlarmDto.PageResponse selectPageList(SyAlarmDto.Request search);

    int updateSelective(SyAlarm entity);
    /** 표시경로 노드별 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL).
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    List<Map<String, Object>> selectPathTreeCntsByBizCd(SyAlarmDto.Request search);
}
