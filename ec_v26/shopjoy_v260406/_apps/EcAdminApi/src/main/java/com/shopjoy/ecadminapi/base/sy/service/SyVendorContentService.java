package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorContentDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorContent;
import com.shopjoy.ecadminapi.base.sy.mapper.SyVendorContentMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorContentRepository;
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
public class SyVendorContentService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final SyVendorContentMapper mapper;
    private final SyVendorContentRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyVendorContentDto getById(String id) {
        // sy_vendor_content :: select one :: id [orm:mybatis]
        SyVendorContentDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyVendorContentDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_vendor_content :: select list :: p [orm:mybatis]
        List<SyVendorContentDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyVendorContentDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_vendor_content :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyVendorContent entity) {
        // sy_vendor_content :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyVendorContent create(SyVendorContent entity) {
        entity.setVendorContentId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().userId());
        entity.setRegDate(LocalDateTime.now());
        // sy_vendor_content :: insert or update :: [orm:jpa]
        SyVendorContent result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyVendorContent save(SyVendorContent entity) {
        if (!repository.existsById(entity.getVendorContentId()))
            throw new CmBizException("존재하지 않는 SyVendorContent입니다: " + entity.getVendorContentId());
        entity.setUpdBy(SecurityUtil.getAuthUser().userId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_vendor_content :: insert or update :: [orm:jpa]
        SyVendorContent result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyVendorContent입니다: " + id);
        // sy_vendor_content :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    /** ID 생성: prefix=VEC (sy_vendor_content) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "VEC" + ts + rand;
    }
}
