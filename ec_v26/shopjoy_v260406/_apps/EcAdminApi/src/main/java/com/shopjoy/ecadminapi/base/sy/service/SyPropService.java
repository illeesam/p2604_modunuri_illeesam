package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPropDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.mapper.SyPropMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository;
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
public class SyPropService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final SyPropMapper mapper;
    private final SyPropRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyPropDto getById(String id) {
        // sy_prop :: select one :: id [orm:mybatis]
        SyPropDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyPropDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_prop :: select list :: p [orm:mybatis]
        List<SyPropDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyPropDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_prop :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyProp entity) {
        // sy_prop :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyProp create(SyProp entity) {
        entity.setSiteId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().userId());
        entity.setRegDate(LocalDateTime.now());
        // sy_prop :: insert or update :: [orm:jpa]
        SyProp result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyProp save(SyProp entity) {
        if (!repository.existsById(entity.getSiteId()))
            throw new CmBizException("존재하지 않는 SyProp입니다: " + entity.getSiteId());
        entity.setUpdBy(SecurityUtil.getAuthUser().userId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_prop :: insert or update :: [orm:jpa]
        SyProp result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyProp입니다: " + id);
        // sy_prop :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    /** ID 생성: prefix=PR (sy_prop) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "PR" + ts + rand;
    }
}
