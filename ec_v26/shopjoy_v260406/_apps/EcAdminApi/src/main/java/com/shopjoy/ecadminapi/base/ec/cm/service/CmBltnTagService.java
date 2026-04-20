package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBltnTagDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltnTag;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBltnTagMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBltnTagRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CmBltnTagService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final CmBltnTagMapper mapper;
    private final CmBltnTagRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmBltnTagDto getById(String id) {
        CmBltnTagDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<CmBltnTagDto> getList(Map<String, Object> p) {
        List<CmBltnTagDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<CmBltnTagDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<CmBltnTagDto> pageList = mapper.selectPageList(p);
        PageResult<CmBltnTagDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(CmBltnTag entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public CmBltnTag create(CmBltnTag entity) {
        entity.setBlogTagId(generateId());
        entity.setRegBy(SecurityUtil.currentUserId());
        entity.setRegDate(LocalDateTime.now());
        CmBltnTag result = repository.save(entity);
        return result;
    }

    @Transactional
    public CmBltnTag save(CmBltnTag entity) {
        if (!repository.existsById(entity.getBlogTagId()))
            throw new CmBizException("존재하지 않는 CmBltnTag입니다: " + entity.getBlogTagId());
        entity.setUpdBy(SecurityUtil.currentUserId());
        entity.setUpdDate(LocalDateTime.now());
        CmBltnTag result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 CmBltnTag입니다: " + id);
        repository.deleteById(id);
    }

    /** ID 생성: prefix=BLT (cm_bltn_tag) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "BLT" + ts + rand;
    }
}
