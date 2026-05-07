package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhBatchHist;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhBatchHistMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhBatchHistRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SyhBatchHistService {

    private final SyhBatchHistMapper syhBatchHistMapper;
    private final SyhBatchHistRepository syhBatchHistRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyhBatchHistDto getById(String id) {
        // syh_batch_hist :: select one :: id [orm:mybatis]
        SyhBatchHistDto result = syhBatchHistMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<SyhBatchHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // syh_batch_hist :: select list :: p [orm:mybatis]
        List<SyhBatchHistDto> result = syhBatchHistMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<SyhBatchHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // syh_batch_hist :: select page :: [orm:mybatis]
        return PageResult.of(syhBatchHistMapper.selectPageList(p), syhBatchHistMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhBatchHist entity) {
        // syh_batch_hist :: update :: [orm:mybatis]
        int result = syhBatchHistMapper.updateSelective(entity);
        return result;
    }

}
