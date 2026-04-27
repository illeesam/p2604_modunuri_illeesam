package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttachGrp;
import com.shopjoy.ecadminapi.base.sy.mapper.SyAttachGrpMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyAttachGrpRepository;
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
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
@RequiredArgsConstructor
public class SyAttachGrpService {


    private final SyAttachGrpMapper mapper;
    private final SyAttachGrpRepository repository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyAttachGrpDto getById(String id) {
        // sy_attach_grp :: select one :: id [orm:mybatis]
        SyAttachGrpDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyAttachGrpDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_attach_grp :: select list :: p [orm:mybatis]
        List<SyAttachGrpDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyAttachGrpDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_attach_grp :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyAttachGrp entity) {
        // sy_attach_grp :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyAttachGrp create(SyAttachGrp entity) {
        entity.setAttachGrpId(CmUtil.generateId("sy_attach_grp"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_attach_grp :: insert or update :: [orm:jpa]
        SyAttachGrp result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyAttachGrp save(SyAttachGrp entity) {
        if (!repository.existsById(entity.getAttachGrpId()))
            throw new CmBizException("존재하지 않는 SyAttachGrp입니다: " + entity.getAttachGrpId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_attach_grp :: insert or update :: [orm:jpa]
        SyAttachGrp result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        SyAttachGrp entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

}
