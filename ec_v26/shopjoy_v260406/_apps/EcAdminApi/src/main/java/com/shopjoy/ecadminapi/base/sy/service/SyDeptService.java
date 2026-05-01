package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyDeptDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyDept;
import com.shopjoy.ecadminapi.base.sy.mapper.SyDeptMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyDeptRepository;
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

@Service
@RequiredArgsConstructor
public class SyDeptService {


    private final SyDeptMapper mapper;
    private final SyDeptRepository repository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SyDeptDto> getTree() {
        return mapper.selectTree();
    }

    @Transactional(readOnly = true)
    public SyDeptDto getById(String id) {
        // sy_dept :: select one :: id [orm:mybatis]
        SyDeptDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyDeptDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_dept :: select list :: p [orm:mybatis]
        List<SyDeptDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyDeptDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_dept :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyDept entity) {
        // sy_dept :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyDept create(SyDept entity) {
        entity.setDeptId(CmUtil.generateId("sy_dept"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_dept :: insert or update :: [orm:jpa]
        SyDept result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyDept save(SyDept entity) {
        if (!repository.existsById(entity.getDeptId()))
            throw new CmBizException("존재하지 않는 SyDept입니다: " + entity.getDeptId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_dept :: insert or update :: [orm:jpa]
        SyDept result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        SyDept entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

}
