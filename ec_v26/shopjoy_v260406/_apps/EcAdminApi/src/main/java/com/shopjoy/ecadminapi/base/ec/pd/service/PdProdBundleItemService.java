package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdBundleItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdBundleItem;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdBundleItemMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdBundleItemRepository;
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
public class PdProdBundleItemService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final PdProdBundleItemMapper mapper;
    private final PdProdBundleItemRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdProdBundleItemDto getById(String id) {
        // pd_prod_bundle_item :: select one :: id [orm:mybatis]
        PdProdBundleItemDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdProdBundleItemDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_prod_bundle_item :: select list :: p [orm:mybatis]
        List<PdProdBundleItemDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdProdBundleItemDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_prod_bundle_item :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdProdBundleItem entity) {
        // pd_prod_bundle_item :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdProdBundleItem create(PdProdBundleItem entity) {
        entity.setBundleItemId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // pd_prod_bundle_item :: insert or update :: [orm:jpa]
        PdProdBundleItem result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdProdBundleItem save(PdProdBundleItem entity) {
        if (!repository.existsById(entity.getBundleItemId()))
            throw new CmBizException("존재하지 않는 PdProdBundleItem입니다: " + entity.getBundleItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_bundle_item :: insert or update :: [orm:jpa]
        PdProdBundleItem result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdProdBundleItem입니다: " + id);
        // pd_prod_bundle_item :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    /** ID 생성: prefix=PRBI (pd_prod_bundle_item) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "PRBI" + ts + rand;
    }
}
