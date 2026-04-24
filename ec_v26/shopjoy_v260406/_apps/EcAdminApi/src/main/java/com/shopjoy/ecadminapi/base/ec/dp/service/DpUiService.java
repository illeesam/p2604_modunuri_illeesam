package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpUiMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpUiRepository;
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
public class DpUiService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final DpUiMapper mapper;
    private final DpUiRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DpUiDto getById(String id) {
        // dp_ui :: select one :: id [orm:mybatis]
        DpUiDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<DpUiDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // dp_ui :: select list :: p [orm:mybatis]
        List<DpUiDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<DpUiDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // dp_ui :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(DpUi entity) {
        // dp_ui :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public DpUi create(DpUi entity) {
        entity.setUiId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // dp_ui :: insert or update :: [orm:jpa]
        DpUi result = repository.save(entity);
        return result;
    }

    @Transactional
    public DpUi save(DpUi entity) {
        if (!repository.existsById(entity.getUiId()))
            throw new CmBizException("존재하지 않는 DpUi입니다: " + entity.getUiId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_ui :: insert or update :: [orm:jpa]
        DpUi result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 DpUi입니다: " + id);
        // dp_ui :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    /** ID 생성: prefix=UI (dp_ui) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "UI" + ts + rand;
    }
}
