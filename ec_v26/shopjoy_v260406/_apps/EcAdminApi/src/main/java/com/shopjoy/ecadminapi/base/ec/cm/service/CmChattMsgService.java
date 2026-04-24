package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattMsgDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMsg;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmChattMsgMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmChattMsgRepository;
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
public class CmChattMsgService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final CmChattMsgMapper mapper;
    private final CmChattMsgRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmChattMsgDto getById(String id) {
        // cm_chatt_msg :: select one :: id [orm:mybatis]
        CmChattMsgDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<CmChattMsgDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // cm_chatt_msg :: select list :: p [orm:mybatis]
        List<CmChattMsgDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<CmChattMsgDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // cm_chatt_msg :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(CmChattMsg entity) {
        // cm_chatt_msg :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public CmChattMsg create(CmChattMsg entity) {
        entity.setChattMsgId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // cm_chatt_msg :: insert or update :: [orm:jpa]
        CmChattMsg result = repository.save(entity);
        return result;
    }

    @Transactional
    public CmChattMsg save(CmChattMsg entity) {
        if (!repository.existsById(entity.getChattMsgId()))
            throw new CmBizException("존재하지 않는 CmChattMsg입니다: " + entity.getChattMsgId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_chatt_msg :: insert or update :: [orm:jpa]
        CmChattMsg result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 CmChattMsg입니다: " + id);
        // cm_chatt_msg :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    /** ID 생성: prefix=CHM (cm_chatt_msg) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "CHM" + ts + rand;
    }
}
