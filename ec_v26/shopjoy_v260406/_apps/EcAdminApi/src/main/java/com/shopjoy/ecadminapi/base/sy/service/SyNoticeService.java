package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyNoticeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNotice;
import com.shopjoy.ecadminapi.base.sy.mapper.SyNoticeMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyNoticeRepository;
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
public class SyNoticeService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final SyNoticeMapper mapper;
    private final SyNoticeRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyNoticeDto getById(String id) {
        // sy_notice :: select one :: id [orm:mybatis]
        SyNoticeDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyNoticeDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_notice :: select list :: p [orm:mybatis]
        List<SyNoticeDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyNoticeDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_notice :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyNotice entity) {
        // sy_notice :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyNotice create(SyNotice entity) {
        entity.setNoticeId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // sy_notice :: insert or update :: [orm:jpa]
        SyNotice result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyNotice save(SyNotice entity) {
        if (!repository.existsById(entity.getNoticeId()))
            throw new CmBizException("존재하지 않는 SyNotice입니다: " + entity.getNoticeId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_notice :: insert or update :: [orm:jpa]
        SyNotice result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyNotice입니다: " + id);
        // sy_notice :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    /** ID 생성: prefix=NO (sy_notice) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "NO" + ts + rand;
    }
}
