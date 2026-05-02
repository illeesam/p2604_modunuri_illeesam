package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdDlivTmpltDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdDlivTmplt;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdDlivTmpltMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdDlivTmpltRepository;
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
public class PdDlivTmpltService {


    private final PdDlivTmpltMapper mapper;
    private final PdDlivTmpltRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdDlivTmpltDto getById(String id) {
        // pd_dliv_tmplt :: select one :: id [orm:mybatis]
        PdDlivTmpltDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdDlivTmpltDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_dliv_tmplt :: select list :: p [orm:mybatis]
        List<PdDlivTmpltDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdDlivTmpltDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_dliv_tmplt :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdDlivTmplt entity) {
        // pd_dliv_tmplt :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdDlivTmplt create(PdDlivTmplt entity) {
        entity.setDlivTmpltId(CmUtil.generateId("pd_dliv_tmplt"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_dliv_tmplt :: insert or update :: [orm:jpa]
        PdDlivTmplt result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdDlivTmplt save(PdDlivTmplt entity) {
        if (!repository.existsById(entity.getDlivTmpltId()))
            throw new CmBizException("존재하지 않는 PdDlivTmplt입니다: " + entity.getDlivTmpltId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_dliv_tmplt :: insert or update :: [orm:jpa]
        PdDlivTmplt result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdDlivTmplt입니다: " + id);
        // pd_dliv_tmplt :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    @Transactional
    public void saveList(List<PdDlivTmplt> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdDlivTmplt row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setDlivTmpltId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_dliv_tmplt"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                repository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getDlivTmpltId(), "dlivTmpltId must not be null");
                PdDlivTmplt entity = repository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "dlivTmpltId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                repository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getDlivTmpltId(), "dlivTmpltId must not be null");
                if (repository.existsById(id)) repository.deleteById(id);
            }
        }
    }
}