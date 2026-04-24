package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbm;
import com.shopjoy.ecadminapi.base.sy.mapper.SyBbmMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyBbmRepository;
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
public class SyBbmService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final SyBbmMapper mapper;
    private final SyBbmRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyBbmDto getById(String id) {
        // sy_bbm :: select one :: id [orm:mybatis]
        SyBbmDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyBbmDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_bbm :: select list :: p [orm:mybatis]
        List<SyBbmDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyBbmDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_bbm :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyBbm entity) {
        // sy_bbm :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyBbm create(SyBbm entity) {
        entity.setBbmId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().userId());
        entity.setRegDate(LocalDateTime.now());
        // sy_bbm :: insert or update :: [orm:jpa]
        SyBbm result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyBbm save(SyBbm entity) {
        if (!repository.existsById(entity.getBbmId()))
            throw new CmBizException("존재하지 않는 SyBbm입니다: " + entity.getBbmId());
        entity.setUpdBy(SecurityUtil.getAuthUser().userId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_bbm :: insert or update :: [orm:jpa]
        SyBbm result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyBbm입니다: " + id);
        // sy_bbm :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    /** ID 생성: prefix=BB (sy_bbm) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "BB" + ts + rand;
    }
}
