package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendMsgLog;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhSendMsgLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhSendMsgLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SyhSendMsgLogService {

    private final SyhSendMsgLogMapper mapper;
    private final SyhSendMsgLogRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyhSendMsgLogDto getById(String id) {
        // syh_send_msg_log :: select one :: id [orm:mybatis]
        SyhSendMsgLogDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyhSendMsgLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // syh_send_msg_log :: select list :: p [orm:mybatis]
        List<SyhSendMsgLogDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyhSendMsgLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // syh_send_msg_log :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyhSendMsgLog entity) {
        // syh_send_msg_log :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

}
