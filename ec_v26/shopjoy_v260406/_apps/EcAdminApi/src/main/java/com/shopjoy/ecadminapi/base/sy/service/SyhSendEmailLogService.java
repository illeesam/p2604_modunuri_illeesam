package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendEmailLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendEmailLog;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhSendEmailLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhSendEmailLogRepository;
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
public class SyhSendEmailLogService {

    private final SyhSendEmailLogMapper syhSendEmailLogMapper;
    private final SyhSendEmailLogRepository syhSendEmailLogRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public SyhSendEmailLogDto getById(String id) {
        // syh_send_email_log :: select one :: id [orm:mybatis]
        SyhSendEmailLogDto result = syhSendEmailLogMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<SyhSendEmailLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // syh_send_email_log :: select list :: p [orm:mybatis]
        List<SyhSendEmailLogDto> result = syhSendEmailLogMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<SyhSendEmailLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // syh_send_email_log :: select page :: [orm:mybatis]
        return PageResult.of(syhSendEmailLogMapper.selectPageList(p), syhSendEmailLogMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhSendEmailLog entity) {
        // syh_send_email_log :: update :: [orm:mybatis]
        int result = syhSendEmailLogMapper.updateSelective(entity);
        return result;
    }

}
