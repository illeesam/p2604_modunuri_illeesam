package com.shopjoy.ecadminapi.base.sy.service;

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
        return syhAlarmSendHistRepository.selectById(id).orElse(null);
    }

    /** getList — 목록조회 */
    public List<SyhAlarmSendHistDto.Item> getList(SyhAlarmSendHistDto.Request req) {
        return syhAlarmSendHistRepository.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public SyhAlarmSendHistDto.PageResponse getPageData(SyhAlarmSendHistDto.Request req) {
        PageHelper.addPaging(req);
        return syhAlarmSendHistRepository.selectPageList(req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhAlarmSendHist entity) {
        return syhAlarmSendHistRepository.updateSelective(entity);
    }
}
