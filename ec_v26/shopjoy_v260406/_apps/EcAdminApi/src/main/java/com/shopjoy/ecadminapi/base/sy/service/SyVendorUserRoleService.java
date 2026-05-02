package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUserRole;
import com.shopjoy.ecadminapi.base.sy.mapper.SyVendorUserRoleMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorUserRoleRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;

@Service
@RequiredArgsConstructor
public class SyVendorUserRoleService {


    private final SyVendorUserRoleMapper mapper;
    private final SyVendorUserRoleRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyVendorUserRoleDto getById(String id) {
        // sy_vendor_user_role :: select one :: id [orm:mybatis]
        return mapper.selectById(id);
    }

    @Transactional(readOnly = true)
    public List<SyVendorUserRoleDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_vendor_user_role :: select list :: p [orm:mybatis]
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyVendorUserRoleDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_vendor_user_role :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyVendorUserRole entity) {
        // sy_vendor_user_role :: update :: entity [orm:mybatis]
        return mapper.updateSelective(entity);
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyVendorUserRole create(SyVendorUserRole entity) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        entity.setVendorUserRoleId(CmUtil.generateId("sy_vendor_user_role"));
        entity.setGrantUserId(authId);
        entity.setGrantDate(now);
        entity.setRegBy(authId);
        entity.setRegDate(now);
        // sy_vendor_user_role :: insert or update :: [orm:jpa]
        return repository.save(entity);
    }

    @Transactional
    public SyVendorUserRole save(SyVendorUserRole entity) {
        if (!repository.existsById(entity.getVendorUserRoleId()))
            throw new CmBizException("존재하지 않는 SyVendorUserRole입니다: " + entity.getVendorUserRoleId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId()); // nullable — intentional
        entity.setUpdDate(LocalDateTime.now());
        // sy_vendor_user_role :: insert or update :: [orm:jpa]
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyVendorUserRole입니다: " + id);
        // sy_vendor_user_role :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    @Transactional
    public void saveList(List<SyVendorUserRole> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyVendorUserRole row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setVendorUserRoleId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_vendor_user_role"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                repository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getVendorUserRoleId(), "vendorUserRoleId must not be null");
                SyVendorUserRole entity = repository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "vendorUserRoleId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                repository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getVendorUserRoleId(), "vendorUserRoleId must not be null");
                if (repository.existsById(id)) repository.deleteById(id);
            }
        }
    }
}