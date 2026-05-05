package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAlarmSendHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAlarmSendHist;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhAlarmSendHistMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhAlarmSendHistRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SyhAlarmSendHistService {

    private final SyhAlarmSendHistMapper syhAlarmSendHistMapper;
    private final SyhAlarmSendHistRepository syhAlarmSendHistRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyhAlarmSendHistDto getById(String id) {
        // syh_alarm_send_hist :: select one :: id [orm:mybatis]
        SyhAlarmSendHistDto result = syhAlarmSendHistMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyhAlarmSendHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // syh_alarm_send_hist :: select list :: p [orm:mybatis]
        List<SyhAlarmSendHistDto> result = syhAlarmSendHistMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyhAlarmSendHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // syh_alarm_send_hist :: select page :: [orm:mybatis]
        return PageResult.of(syhAlarmSendHistMapper.selectPageList(p), syhAlarmSendHistMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyhAlarmSendHist entity) {
        // syh_alarm_send_hist :: update :: [orm:mybatis]
        int result = syhAlarmSendHistMapper.updateSelective(entity);
        return result;
    }

}
