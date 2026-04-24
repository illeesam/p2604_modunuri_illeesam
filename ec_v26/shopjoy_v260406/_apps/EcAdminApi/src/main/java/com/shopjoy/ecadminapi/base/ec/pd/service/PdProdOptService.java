package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdOptMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdOptRepository;
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
public class PdProdOptService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final PdProdOptMapper mapper;
    private final PdProdOptRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdProdOptDto getById(String id) {
        // pd_prod_opt :: select one :: id [orm:mybatis]
        PdProdOptDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdProdOptDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_prod_opt :: select list :: p [orm:mybatis]
        List<PdProdOptDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdProdOptDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_prod_opt :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdProdOpt entity) {
        // pd_prod_opt :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdProdOpt create(PdProdOpt entity) {
        entity.setOptId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().userId());
        entity.setRegDate(LocalDateTime.now());
        // pd_prod_opt :: insert or update :: [orm:jpa]
        PdProdOpt result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdProdOpt save(PdProdOpt entity) {
        if (!repository.existsById(entity.getOptId()))
            throw new CmBizException("존재하지 않는 PdProdOpt입니다: " + entity.getOptId());
        entity.setUpdBy(SecurityUtil.getAuthUser().userId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_opt :: insert or update :: [orm:jpa]
        PdProdOpt result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdProdOpt입니다: " + id);
        // pd_prod_opt :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    /** ID 생성: prefix=PRO (pd_prod_opt) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "PRO" + ts + rand;
    }
}
