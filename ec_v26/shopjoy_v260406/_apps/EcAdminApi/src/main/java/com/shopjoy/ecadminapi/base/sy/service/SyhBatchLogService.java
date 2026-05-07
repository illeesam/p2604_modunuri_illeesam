package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhBatchLog;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhBatchLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhBatchLogRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SyhBatchLogService {

    private final SyhBatchLogMapper syhBatchLogMapper;
    private final SyhBatchLogRepository syhBatchLogRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyhBatchLogDto getById(String id) {
        // syh_batch_log :: select one :: id [orm:mybatis]
        SyhBatchLogDto result = syhBatchLogMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<SyhBatchLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // syh_batch_log :: select list :: p [orm:mybatis]
        List<SyhBatchLogDto> result = syhBatchLogMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<SyhBatchLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // syh_batch_log :: select page :: [orm:mybatis]
        return PageResult.of(syhBatchLogMapper.selectPageList(p), syhBatchLogMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhBatchLog entity) {
        // syh_batch_log :: update :: [orm:mybatis]
        int result = syhBatchLogMapper.updateSelective(entity);
        return result;
    }

}
