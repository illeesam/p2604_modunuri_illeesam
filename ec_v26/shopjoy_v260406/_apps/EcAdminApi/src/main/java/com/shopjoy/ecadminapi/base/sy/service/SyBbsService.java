package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbsDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;
import com.shopjoy.ecadminapi.base.sy.mapper.SyBbsMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyBbsRepository;
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
public class SyBbsService {


    private final SyBbsMapper mapper;
    private final SyBbsRepository repository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyBbsDto getById(String id) {
        // sy_bbs :: select one :: id [orm:mybatis]
        SyBbsDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyBbsDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_bbs :: select list :: p [orm:mybatis]
        List<SyBbsDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyBbsDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_bbs :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyBbs entity) {
        // sy_bbs :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyBbs create(SyBbs entity) {
        entity.setBbsId(CmUtil.generateId("sy_bbs"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_bbs :: insert or update :: [orm:jpa]
        SyBbs result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyBbs save(SyBbs entity) {
        if (!repository.existsById(entity.getBbsId()))
            throw new CmBizException("존재하지 않는 SyBbs입니다: " + entity.getBbsId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_bbs :: insert or update :: [orm:jpa]
        SyBbs result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        SyBbs entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

}
