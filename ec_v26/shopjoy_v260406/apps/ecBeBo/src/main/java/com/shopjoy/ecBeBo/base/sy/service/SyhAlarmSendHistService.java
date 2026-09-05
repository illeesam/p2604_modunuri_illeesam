package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAlarmSendHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAlarmSendHist;
import com.shopjoy.ecadminapi.base.sy.repository.SyhAlarmSendHistRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhAlarmSendHistService {

    private final SyhAlarmSendHistRepository syhAlarmSendHistRepository;

    /** getById — 단건조회 */
    public SyhAlarmSendHistDto.Item getById(String id) {
        // [QueryDSL] 알림 발송 이력 단건 조회
        return syhAlarmSendHistRepository.selectById(id).orElse(null);
    }

    /** getList — 목록조회 */
    public List<SyhAlarmSendHistDto.Item> getList(SyhAlarmSendHistDto.Request req) {
        // [QueryDSL] 알림 발송 이력 목록 조회
        return syhAlarmSendHistRepository.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public BasePage<SyhAlarmSendHistDto.Item> getPageData(SyhAlarmSendHistDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 알림 발송 이력 페이지 조회
        return syhAlarmSendHistRepository.selectPageData(req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhAlarmSendHist entity) {
        // [QueryDSL] 알림 발송 이력 선택적 필드 수정
        return syhAlarmSendHistRepository.updateSelective(entity);
    }
}
