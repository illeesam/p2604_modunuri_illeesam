package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdTag;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdTagMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdTagRepository;
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
public class PdTagService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final PdTagMapper mapper;
    private final PdTagRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdTagDto getById(String id) {
        PdTagDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdTagDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<PdTagDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdTagDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdTag entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdTag create(PdTag entity) {
        entity.setTagId(generateId());
        entity.setRegBy(SecurityUtil.getUserId());
        entity.setRegDate(LocalDateTime.now());
        PdTag result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdTag save(PdTag entity) {
        if (!repository.existsById(entity.getTagId()))
            throw new CmBizException("존재하지 않는 PdTag입니다: " + entity.getTagId());
        entity.setUpdBy(SecurityUtil.getUserId());
        entity.setUpdDate(LocalDateTime.now());
        PdTag result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdTag입니다: " + id);
        repository.deleteById(id);
    }

    /** ID 생성: prefix=TA (pd_tag) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "TA" + ts + rand;
    }
}
