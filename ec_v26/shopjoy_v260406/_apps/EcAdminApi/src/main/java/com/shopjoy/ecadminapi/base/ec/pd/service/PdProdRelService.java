package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdRelDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdRel;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdRelMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdRelRepository;
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
public class PdProdRelService {

    private final PdProdRelMapper mapper;
    private final PdProdRelRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdProdRelDto getById(String id) {
        // pd_prod_rel :: select one :: id [orm:mybatis]
        PdProdRelDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdProdRelDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_prod_rel :: select list :: p [orm:mybatis]
        List<PdProdRelDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdProdRelDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_prod_rel :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdProdRel entity) {
        // pd_prod_rel :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdProdRel create(PdProdRel entity) {
        entity.setProdRelId(CmUtil.generateId("pd_prod_rel"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_rel :: insert or update :: [orm:jpa]
        PdProdRel result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdProdRel save(PdProdRel entity) {
        if (!repository.existsById(entity.getProdRelId()))
            throw new CmBizException("존재하지 않는 PdProdRel입니다: " + entity.getProdRelId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_rel :: insert or update :: [orm:jpa]
        PdProdRel result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdProdRel입니다: " + id);
        // pd_prod_rel :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }
    @Transactional
    public void saveList(List<PdProdRel> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdProdRel row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setProdRelId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_prod_rel"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                repository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getProdRelId(), "prodRelId must not be null");
                PdProdRel entity = repository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "prodRelId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                repository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getProdRelId(), "prodRelId must not be null");
                if (repository.existsById(id)) repository.deleteById(id);
            }
        }
    }
}