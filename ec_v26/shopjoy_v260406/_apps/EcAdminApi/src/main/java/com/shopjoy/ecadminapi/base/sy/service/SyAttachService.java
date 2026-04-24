package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.base.sy.mapper.SyAttachMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyAttachRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class SyAttachService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final SyAttachMapper mapper;
    private final SyAttachRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyAttachDto getById(String id) {
        // sy_attach :: select one :: id [orm:mybatis]
        SyAttachDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyAttachDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_attach :: select list :: p [orm:mybatis]
        List<SyAttachDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyAttachDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_attach :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyAttach entity) {
        // sy_attach :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyAttach create(SyAttach entity) {
        entity.setAttachId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // sy_attach :: insert or update :: [orm:jpa]
        SyAttach result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyAttach save(SyAttach entity) {
        if (!repository.existsById(entity.getAttachId()))
            throw new CmBizException("존재하지 않는 SyAttach입니다: " + entity.getAttachId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_attach :: insert or update :: [orm:jpa]
        SyAttach result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyAttach입니다: " + id);
        // sy_attach :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    /** ID 생성: prefix=AT (sy_attach) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "AT" + ts + rand;
    }
}
