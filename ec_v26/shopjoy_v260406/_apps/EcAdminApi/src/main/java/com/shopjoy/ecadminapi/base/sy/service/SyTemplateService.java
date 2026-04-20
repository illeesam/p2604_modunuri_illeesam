package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyTemplateDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import com.shopjoy.ecadminapi.base.sy.mapper.SyTemplateMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyTemplateRepository;
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

@Service
@RequiredArgsConstructor
public class SyTemplateService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final SyTemplateMapper mapper;
    private final SyTemplateRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyTemplateDto getById(String id) {
        SyTemplateDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyTemplateDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<SyTemplateDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyTemplateDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyTemplate entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyTemplate create(SyTemplate entity) {
        entity.setTemplateId(generateId());
        entity.setRegBy(SecurityUtil.currentUserId());
        entity.setRegDate(LocalDateTime.now());
        SyTemplate result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyTemplate save(SyTemplate entity) {
        if (!repository.existsById(entity.getTemplateId()))
            throw new CmBizException("존재하지 않는 SyTemplate입니다: " + entity.getTemplateId());
        entity.setUpdBy(SecurityUtil.currentUserId());
        entity.setUpdDate(LocalDateTime.now());
        SyTemplate result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyTemplate입니다: " + id);
        repository.deleteById(id);
    }

    /** ID 생성: prefix=TE (sy_template) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "TE" + ts + rand;
    }
}
