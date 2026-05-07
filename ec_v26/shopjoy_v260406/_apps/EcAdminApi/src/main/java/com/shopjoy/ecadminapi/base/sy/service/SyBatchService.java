package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBatchDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.mapper.SyBatchMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyBatchRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;

@Service
@RequiredArgsConstructor
public class SyBatchService {


    private final SyBatchMapper syBatchMapper;
    private final SyBatchRepository syBatchRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyBatchDto getById(String id) {
        // sy_batch :: select one :: id [orm:mybatis]
        SyBatchDto result = syBatchMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<SyBatchDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_batch :: select list :: p [orm:mybatis]
        List<SyBatchDto> result = syBatchMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<SyBatchDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_batch :: select page :: p [orm:mybatis]
        return PageResult.of(syBatchMapper.selectPageList(p), syBatchMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyBatch entity) {
        // sy_batch :: update :: entity [orm:mybatis]
        int result = syBatchMapper.updateSelective(entity);
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
        SyBatch result = syBatchRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public SyBatch save(SyBatch entity) {
        if (!syBatchRepository.existsById(entity.getBatchId()))
            throw new CmBizException("존재하지 않는 SyBatch입니다: " + entity.getBatchId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_batch :: insert or update :: [orm:jpa]
        SyBatch result = syBatchRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyBatch entity = syBatchRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syBatchRepository.delete(entity);
        em.flush();
        if (syBatchRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyBatch> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyBatch row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setBatchId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_batch"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syBatchRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getBatchId(), "batchId must not be null");
                SyBatch entity = syBatchRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "batchId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syBatchRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getBatchId(), "batchId must not be null");
                if (syBatchRepository.existsById(id)) syBatchRepository.deleteById(id);
            }
        }
        em.flush();
    }
}