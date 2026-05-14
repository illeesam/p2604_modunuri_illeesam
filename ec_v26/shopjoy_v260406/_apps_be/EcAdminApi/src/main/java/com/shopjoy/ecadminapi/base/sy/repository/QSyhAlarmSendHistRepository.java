package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAlarmSendHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAlarmSendHist;

import java.util.List;
import java.util.Optional;

/** SyhAlarmSendHist QueryDSL Custom Repository */
public interface QSyhAlarmSendHistRepository {

    /** 단건 조회 */
    Optional<SyhAlarmSendHistDto.Item> selectById(String id);

    /** 전체 목록 */
    List<SyhAlarmSendHistDto.Item> selectList(SyhAlarmSendHistDto.Request search);

    /** 페이지 목록 */
    SyhAlarmSendHistDto.PageResponse selectPageList(SyhAlarmSendHistDto.Request search);

    int updateSelective(SyhAlarmSendHist entity);
}
