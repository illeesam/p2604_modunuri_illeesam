package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVocDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVoc;
import com.shopjoy.ecadminapi.base.sy.mapper.SyVocMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyVocRepository;
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
public class SyVocService {


    private final SyVocMapper mapper;
    private final SyVocRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyVocDto getById(String id) {
        // sy_voc :: select one :: id [orm:mybatis]
        SyVocDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyVocDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_voc :: select list :: p [orm:mybatis]
        List<SyVocDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyVocDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_voc :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyVoc entity) {
        // sy_voc :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyVoc create(SyVoc entity) {
        entity.setVocId(CmUtil.generateId("sy_voc"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_voc :: insert or update :: [orm:jpa]
        SyVoc result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyVoc save(SyVoc entity) {
        if (!repository.existsById(entity.getVocId()))
            throw new CmBizException("존재하지 않는 SyVoc입니다: " + entity.getVocId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_voc :: insert or update :: [orm:jpa]
        SyVoc result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        SyVoc entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

}
