package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBrand;
import com.shopjoy.ecadminapi.base.sy.mapper.SyBrandMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyBrandRepository;
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
public class SyBrandService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final SyBrandMapper mapper;
    private final SyBrandRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyBrandDto getById(String id) {
        // sy_brand :: select one :: id [orm:mybatis]
        SyBrandDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyBrandDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_brand :: select list :: p [orm:mybatis]
        List<SyBrandDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyBrandDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_brand :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyBrand entity) {
        // sy_brand :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyBrand create(SyBrand entity) {
        entity.setBrandId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().userId());
        entity.setRegDate(LocalDateTime.now());
        // sy_brand :: insert or update :: [orm:jpa]
        SyBrand result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyBrand save(SyBrand entity) {
        if (!repository.existsById(entity.getBrandId()))
            throw new CmBizException("존재하지 않는 SyBrand입니다: " + entity.getBrandId());
        entity.setUpdBy(SecurityUtil.getAuthUser().userId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_brand :: insert or update :: [orm:jpa]
        SyBrand result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyBrand입니다: " + id);
        // sy_brand :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    /** ID 생성: prefix=BR (sy_brand) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "BR" + ts + rand;
    }
}
