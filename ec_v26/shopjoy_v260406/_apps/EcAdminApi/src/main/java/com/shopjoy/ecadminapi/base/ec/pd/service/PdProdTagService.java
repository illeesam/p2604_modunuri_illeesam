package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdTag;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdTagMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdTagRepository;
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
public class PdProdTagService {

    private final PdProdTagMapper pdProdTagMapper;
    private final PdProdTagRepository pdProdTagRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdProdTagDto getById(String id) {
        // pd_prod_tag :: select one :: id [orm:mybatis]
        PdProdTagDto result = pdProdTagMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdProdTagDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_prod_tag :: select list :: p [orm:mybatis]
        List<PdProdTagDto> result = pdProdTagMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdProdTagDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_prod_tag :: select page :: [orm:mybatis]
        return PageResult.of(pdProdTagMapper.selectPageList(p), pdProdTagMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdProdTag entity) {
        // pd_prod_tag :: update :: [orm:mybatis]
        int result = pdProdTagMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdProdTag create(PdProdTag entity) {
        entity.setProdTagId(CmUtil.generateId("pd_prod_tag"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_tag :: insert or update :: [orm:jpa]
        PdProdTag result = pdProdTagRepository.save(entity);
        return result;
    }

    @Transactional
    public PdProdTag save(PdProdTag entity) {
        if (!pdProdTagRepository.existsById(entity.getProdTagId()))
            throw new CmBizException("존재하지 않는 PdProdTag입니다: " + entity.getProdTagId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_tag :: insert or update :: [orm:jpa]
        PdProdTag result = pdProdTagRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!pdProdTagRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PdProdTag입니다: " + id);
        // pd_prod_tag :: delete :: id [orm:jpa]
        pdProdTagRepository.deleteById(id);
    }
    @Transactional
    public void saveList(List<PdProdTag> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdProdTag row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setProdTagId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_prod_tag"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdProdTagRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getProdTagId(), "prodTagId must not be null");
                PdProdTag entity = pdProdTagRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "prodTagId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pdProdTagRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getProdTagId(), "prodTagId must not be null");
                if (pdProdTagRepository.existsById(id)) pdProdTagRepository.deleteById(id);
            }
        }
    }
}