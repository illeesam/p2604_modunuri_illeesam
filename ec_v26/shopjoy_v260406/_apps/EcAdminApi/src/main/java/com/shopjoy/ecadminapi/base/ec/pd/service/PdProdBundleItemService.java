package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdBundleItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdBundleItem;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdBundleItemMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdBundleItemRepository;
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
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import com.shopjoy.ecadminapi.co.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class PdProdBundleItemService {

    private final PdProdBundleItemMapper pdProdBundleItemMapper;
    private final PdProdBundleItemRepository pdProdBundleItemRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdProdBundleItemDto getById(String id) {
        // pd_prod_bundle_item :: select one :: id [orm:mybatis]
        PdProdBundleItemDto result = pdProdBundleItemMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdProdBundleItemDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_prod_bundle_item :: select list :: p [orm:mybatis]
        List<PdProdBundleItemDto> result = pdProdBundleItemMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdProdBundleItemDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_prod_bundle_item :: select page :: [orm:mybatis]
        return PageResult.of(pdProdBundleItemMapper.selectPageList(p), pdProdBundleItemMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdProdBundleItem entity) {
        // pd_prod_bundle_item :: update :: [orm:mybatis]
        int result = pdProdBundleItemMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdProdBundleItem create(PdProdBundleItem entity) {
        entity.setBundleItemId(CmUtil.generateId("pd_prod_bundle_item"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_bundle_item :: insert or update :: [orm:jpa]
        PdProdBundleItem result = pdProdBundleItemRepository.save(entity);
        return result;
    }

    @Transactional
    public PdProdBundleItem save(PdProdBundleItem entity) {
        if (!pdProdBundleItemRepository.existsById(entity.getBundleItemId()))
            throw new CmBizException("존재하지 않는 PdProdBundleItem입니다: " + entity.getBundleItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_bundle_item :: insert or update :: [orm:jpa]
        PdProdBundleItem result = pdProdBundleItemRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!pdProdBundleItemRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PdProdBundleItem입니다: " + id);
        // pd_prod_bundle_item :: delete :: id [orm:jpa]
        pdProdBundleItemRepository.deleteById(id);
    }
    @Transactional
    public void saveList(List<PdProdBundleItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdProdBundleItem row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setBundleItemId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_prod_bundle_item"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdProdBundleItemRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getBundleItemId(), "bundleItemId must not be null");
                PdProdBundleItem entity = pdProdBundleItemRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "bundleItemId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pdProdBundleItemRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getBundleItemId(), "bundleItemId must not be null");
                if (pdProdBundleItemRepository.existsById(id)) pdProdBundleItemRepository.deleteById(id);
            }
        }
    }
}