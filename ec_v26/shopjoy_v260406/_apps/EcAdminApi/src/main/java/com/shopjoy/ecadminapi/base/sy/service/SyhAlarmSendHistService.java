package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAlarmSendHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAlarmSendHist;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhAlarmSendHistMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhAlarmSendHistRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SyhAlarmSendHistService {

    private final SyhAlarmSendHistMapper mapper;
    private final SyhAlarmSendHistRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyhAlarmSendHistDto getById(String id) {
        // syh_alarm_send_hist :: select one :: id [orm:mybatis]
        SyhAlarmSendHistDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyhAlarmSendHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // syh_alarm_send_hist :: select list :: p [orm:mybatis]
        List<SyhAlarmSendHistDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyhAlarmSendHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // syh_alarm_send_hist :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyhAlarmSendHist entity) {
        // syh_alarm_send_hist :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

}
