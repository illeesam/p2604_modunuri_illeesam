package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdQnaDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdQna;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdQnaMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdQnaRepository;
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
public class PdProdQnaService {

    private final PdProdQnaMapper mapper;
    private final PdProdQnaRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdProdQnaDto getById(String id) {
        // pd_prod_qna :: select one :: id [orm:mybatis]
        PdProdQnaDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdProdQnaDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_prod_qna :: select list :: p [orm:mybatis]
        List<PdProdQnaDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdProdQnaDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_prod_qna :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdProdQna entity) {
        // pd_prod_qna :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdProdQna create(PdProdQna entity) {
        entity.setQnaId(CmUtil.generateId("pd_prod_qna"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_qna :: insert or update :: [orm:jpa]
        PdProdQna result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdProdQna save(PdProdQna entity) {
        if (!repository.existsById(entity.getQnaId()))
            throw new CmBizException("존재하지 않는 PdProdQna입니다: " + entity.getQnaId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_qna :: insert or update :: [orm:jpa]
        PdProdQna result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdProdQna입니다: " + id);
        // pd_prod_qna :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }
    @Transactional
    public void saveList(List<PdProdQna> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdProdQna row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setQnaId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_prod_qna"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                repository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getQnaId(), "qnaId must not be null");
                PdProdQna entity = repository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "qnaId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                repository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getQnaId(), "qnaId must not be null");
                if (repository.existsById(id)) repository.deleteById(id);
            }
        }
    }
}