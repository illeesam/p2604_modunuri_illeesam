package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendMsgLog;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhSendMsgLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhSendMsgLogRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhSendMsgLogService {

    private final SyhSendMsgLogMapper syhSendMsgLogMapper;
    private final SyhSendMsgLogRepository syhSendMsgLogRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public SyhSendMsgLogDto getById(String id) {
        // syh_send_msg_log :: select one :: id [orm:mybatis]
        SyhSendMsgLogDto result = syhSendMsgLogMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<SyhSendMsgLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // syh_send_msg_log :: select list :: p [orm:mybatis]
        List<SyhSendMsgLogDto> result = syhSendMsgLogMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<SyhSendMsgLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // syh_send_msg_log :: select page :: [orm:mybatis]
        return PageResult.of(syhSendMsgLogMapper.selectPageList(p), syhSendMsgLogMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhSendMsgLog entity) {
        // syh_send_msg_log :: update :: [orm:mybatis]
        int result = syhSendMsgLogMapper.updateSelective(entity);
        return result;
    }

}
