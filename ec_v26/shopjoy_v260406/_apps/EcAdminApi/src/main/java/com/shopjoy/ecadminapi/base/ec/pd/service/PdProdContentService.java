package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdContentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdContent;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdContentMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdContentRepository;
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
public class PdProdContentService {

    private final PdProdContentMapper pdProdContentMapper;
    private final PdProdContentRepository pdProdContentRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdProdContentDto getById(String id) {
        // pd_prod_content :: select one :: id [orm:mybatis]
        PdProdContentDto result = pdProdContentMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdProdContentDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_prod_content :: select list :: p [orm:mybatis]
        List<PdProdContentDto> result = pdProdContentMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdProdContentDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_prod_content :: select page :: [orm:mybatis]
        return PageResult.of(pdProdContentMapper.selectPageList(p), pdProdContentMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdProdContent entity) {
        // pd_prod_content :: update :: [orm:mybatis]
        int result = pdProdContentMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdProdContent create(PdProdContent entity) {
        entity.setProdContentId(CmUtil.generateId("pd_prod_content"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_content :: insert or update :: [orm:jpa]
        PdProdContent result = pdProdContentRepository.save(entity);
        return result;
    }

    @Transactional
    public PdProdContent save(PdProdContent entity) {
        if (!pdProdContentRepository.existsById(entity.getProdContentId()))
            throw new CmBizException("존재하지 않는 PdProdContent입니다: " + entity.getProdContentId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_content :: insert or update :: [orm:jpa]
        PdProdContent result = pdProdContentRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!pdProdContentRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PdProdContent입니다: " + id);
        // pd_prod_content :: delete :: id [orm:jpa]
        pdProdContentRepository.deleteById(id);
    }
    @Transactional
    public void saveList(List<PdProdContent> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdProdContent row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setProdContentId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_prod_content"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdProdContentRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getProdContentId(), "prodContentId must not be null");
                PdProdContent entity = pdProdContentRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "prodContentId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pdProdContentRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getProdContentId(), "prodContentId must not be null");
                if (pdProdContentRepository.existsById(id)) pdProdContentRepository.deleteById(id);
            }
        }
    }
}