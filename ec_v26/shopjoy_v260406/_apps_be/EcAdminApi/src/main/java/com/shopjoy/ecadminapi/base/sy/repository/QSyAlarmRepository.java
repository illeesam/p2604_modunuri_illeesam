package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAlarmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;

import java.util.List;
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
}
