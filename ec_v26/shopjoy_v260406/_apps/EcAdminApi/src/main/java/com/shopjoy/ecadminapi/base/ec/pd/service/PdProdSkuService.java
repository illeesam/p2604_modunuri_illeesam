package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSkuDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSku;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdSkuMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdSkuRepository;
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
public class PdProdSkuService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final PdProdSkuMapper mapper;
    private final PdProdSkuRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdProdSkuDto getById(String id) {
        // pd_prod_sku :: select one :: id [orm:mybatis]
        PdProdSkuDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdProdSkuDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_prod_sku :: select list :: p [orm:mybatis]
        List<PdProdSkuDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdProdSkuDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_prod_sku :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdProdSku entity) {
        // pd_prod_sku :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdProdSku create(PdProdSku entity) {
        entity.setSkuId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // pd_prod_sku :: insert or update :: [orm:jpa]
        PdProdSku result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdProdSku save(PdProdSku entity) {
        if (!repository.existsById(entity.getSkuId()))
            throw new CmBizException("존재하지 않는 PdProdSku입니다: " + entity.getSkuId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_sku :: insert or update :: [orm:jpa]
        PdProdSku result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdProdSku입니다: " + id);
        // pd_prod_sku :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    /** ID 생성: prefix=PRS (pd_prod_sku) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "PRS" + ts + rand;
    }
}
