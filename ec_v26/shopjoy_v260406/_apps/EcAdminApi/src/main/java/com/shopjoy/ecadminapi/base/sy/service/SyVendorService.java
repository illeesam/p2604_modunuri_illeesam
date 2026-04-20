package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;
import com.shopjoy.ecadminapi.base.sy.mapper.SyVendorMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorRepository;
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
public class SyVendorService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final SyVendorMapper mapper;
    private final SyVendorRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyVendorDto getById(String id) {
        SyVendorDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyVendorDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<SyVendorDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyVendorDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyVendor entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyVendor create(SyVendor entity) {
        entity.setVendorId(generateId());
        entity.setRegBy(SecurityUtil.currentUserId());
        entity.setRegDate(LocalDateTime.now());
        SyVendor result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyVendor save(SyVendor entity) {
        if (!repository.existsById(entity.getVendorId()))
            throw new CmBizException("존재하지 않는 SyVendor입니다: " + entity.getVendorId());
        entity.setUpdBy(SecurityUtil.currentUserId());
        entity.setUpdDate(LocalDateTime.now());
        SyVendor result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyVendor입니다: " + id);
        repository.deleteById(id);
    }

    /** ID 생성: prefix=VE (sy_vendor) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "VE" + ts + rand;
    }
}
