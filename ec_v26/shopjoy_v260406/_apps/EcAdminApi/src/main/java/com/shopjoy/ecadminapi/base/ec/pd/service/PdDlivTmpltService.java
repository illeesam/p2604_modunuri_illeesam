package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdDlivTmpltDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdDlivTmplt;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdDlivTmpltMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdDlivTmpltRepository;
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
public class PdDlivTmpltService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

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
        entity.setDlivTmpltId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().userId());
        entity.setRegDate(LocalDateTime.now());
        // pd_dliv_tmplt :: insert or update :: [orm:jpa]
        PdDlivTmplt result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdDlivTmplt save(PdDlivTmplt entity) {
        if (!repository.existsById(entity.getDlivTmpltId()))
            throw new CmBizException("존재하지 않는 PdDlivTmplt입니다: " + entity.getDlivTmpltId());
        entity.setUpdBy(SecurityUtil.getAuthUser().userId());
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

    /** ID 생성: prefix=DLT (pd_dliv_tmplt) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "DLT" + ts + rand;
    }
}
