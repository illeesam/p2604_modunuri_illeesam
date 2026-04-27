package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUser;
import com.shopjoy.ecadminapi.base.sy.mapper.SyVendorUserMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorUserRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
@RequiredArgsConstructor
public class SyVendorUserService {


    private final SyVendorUserMapper mapper;
    private final SyVendorUserRepository repository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyVendorUserDto getById(String id) {
        // sy_vendor_user :: select one :: id [orm:mybatis]
        SyVendorUserDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyVendorUserDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_vendor_user :: select list :: p [orm:mybatis]
        List<SyVendorUserDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyVendorUserDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_vendor_user :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyVendorUser entity) {
        // sy_vendor_user :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyVendorUser create(SyVendorUser entity) {
        entity.setVendorUserId(CmUtil.generateId("sy_vendor_user"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_vendor_user :: insert or update :: [orm:jpa]
        SyVendorUser result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyVendorUser save(SyVendorUser entity) {
        if (!repository.existsById(entity.getVendorUserId()))
            throw new CmBizException("존재하지 않는 SyVendorUser입니다: " + entity.getVendorUserId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_vendor_user :: insert or update :: [orm:jpa]
        SyVendorUser result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        SyVendorUser entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

}
