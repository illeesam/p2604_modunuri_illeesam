package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdOptMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdOptRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;

@Service
@RequiredArgsConstructor
public class PdProdOptService {

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
        entity.setOptId(CmUtil.generateId("pd_prod_opt"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_opt :: insert or update :: [orm:jpa]
        PdProdOpt result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdProdOpt save(PdProdOpt entity) {
        if (!repository.existsById(entity.getOptId()))
            throw new CmBizException("존재하지 않는 PdProdOpt입니다: " + entity.getOptId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
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
    @Transactional
    public void saveList(List<PdProdOpt> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdProdOpt row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setOptId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_prod_opt"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                repository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getOptId(), "optId must not be null");
                PdProdOpt entity = repository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "optId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                repository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getOptId(), "optId must not be null");
                if (repository.existsById(id)) repository.deleteById(id);
            }
        }
    }
}