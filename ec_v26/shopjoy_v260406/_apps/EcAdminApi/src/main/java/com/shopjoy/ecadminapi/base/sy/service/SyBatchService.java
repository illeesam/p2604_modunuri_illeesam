package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBatchDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.mapper.SyBatchMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyBatchRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class SyBatchService {


    private final SyBatchMapper mapper;
    private final SyBatchRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyBatchDto getById(String id) {
        // sy_batch :: select one :: id [orm:mybatis]
        SyBatchDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyBatchDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_batch :: select list :: p [orm:mybatis]
        List<SyBatchDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyBatchDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_batch :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyBatch entity) {
        // sy_batch :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyBatch create(SyBatch entity) {
        entity.setBatchId(CmUtil.generateId("sy_batch"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_batch :: insert or update :: [orm:jpa]
        SyBatch result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyBatch save(SyBatch entity) {
        if (!repository.existsById(entity.getBatchId()))
            throw new CmBizException("존재하지 않는 SyBatch입니다: " + entity.getBatchId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_batch :: insert or update :: [orm:jpa]
        SyBatch result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        SyBatch entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

}
