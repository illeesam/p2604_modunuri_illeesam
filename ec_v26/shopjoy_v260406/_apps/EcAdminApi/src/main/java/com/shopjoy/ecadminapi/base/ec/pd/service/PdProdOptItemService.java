package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOptItem;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdOptItemMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdOptItemRepository;
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
public class PdProdOptItemService {

    private final PdProdOptItemMapper mapper;
    private final PdProdOptItemRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdProdOptItemDto getById(String id) {
        // pd_prod_opt_item :: select one :: id [orm:mybatis]
        PdProdOptItemDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdProdOptItemDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_prod_opt_item :: select list :: p [orm:mybatis]
        List<PdProdOptItemDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdProdOptItemDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_prod_opt_item :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdProdOptItem entity) {
        // pd_prod_opt_item :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdProdOptItem create(PdProdOptItem entity) {
        entity.setOptItemId(CmUtil.generateId("pd_prod_opt_item"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_opt_item :: insert or update :: [orm:jpa]
        PdProdOptItem result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdProdOptItem save(PdProdOptItem entity) {
        if (!repository.existsById(entity.getOptItemId()))
            throw new CmBizException("존재하지 않는 PdProdOptItem입니다: " + entity.getOptItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_opt_item :: insert or update :: [orm:jpa]
        PdProdOptItem result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdProdOptItem입니다: " + id);
        // pd_prod_opt_item :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }
    @Transactional
    public void saveList(List<PdProdOptItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdProdOptItem row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setOptItemId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_prod_opt_item"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                repository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getOptItemId(), "optItemId must not be null");
                PdProdOptItem entity = repository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "optItemId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                repository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getOptItemId(), "optItemId must not be null");
                if (repository.existsById(id)) repository.deleteById(id);
            }
        }
    }
}