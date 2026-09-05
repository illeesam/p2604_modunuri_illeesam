package com.shopjoy.ecBeBo.base.sy.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhAlarmSendHistDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyhAlarmSendHist;

import java.util.List;
import java.util.Optional;

/** SyhAlarmSendHist QueryDSL Custom Repository */
public interface QSyhAlarmSendHistRepository {

    /** 단건 조회 */
    Optional<SyhAlarmSendHistDto.Item> selectById(String id);

    /** 전체 목록 */
    List<SyhAlarmSendHistDto.Item> selectList(SyhAlarmSendHistDto.Request search);

    /** 페이지 목록 */
    BasePage<SyhAlarmSendHistDto.Item> selectPageData(SyhAlarmSendHistDto.Request search);

    int updateSelective(SyhAlarmSendHist entity);
}
