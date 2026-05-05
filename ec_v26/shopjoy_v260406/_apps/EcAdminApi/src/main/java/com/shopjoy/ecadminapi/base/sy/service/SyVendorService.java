package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;
import com.shopjoy.ecadminapi.base.sy.mapper.SyVendorMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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
public class SyVendorService {


    private final SyVendorMapper syVendorMapper;
    private final SyVendorRepository syVendorRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyVendorDto getById(String id) {
        // sy_vendor :: select one :: id [orm:mybatis]
        SyVendorDto result = syVendorMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyVendorDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_vendor :: select list :: p [orm:mybatis]
        List<SyVendorDto> result = syVendorMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyVendorDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_vendor :: select page :: p [orm:mybatis]
        return PageResult.of(syVendorMapper.selectPageList(p), syVendorMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyVendor entity) {
        // sy_vendor :: update :: entity [orm:mybatis]
        int result = syVendorMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyVendor create(SyVendor entity) {
        entity.setVendorId(CmUtil.generateId("sy_vendor"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_vendor :: insert or update :: [orm:jpa]
        SyVendor result = syVendorRepository.save(entity);
        return result;
    }

    @Transactional
    public SyVendor save(SyVendor entity) {
        if (!syVendorRepository.existsById(entity.getVendorId()))
            throw new CmBizException("존재하지 않는 SyVendor입니다: " + entity.getVendorId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_vendor :: insert or update :: [orm:jpa]
        SyVendor result = syVendorRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        SyVendor entity = syVendorRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syVendorRepository.delete(entity);
        em.flush();
        if (syVendorRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<SyVendor> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyVendor row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setVendorId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_vendor"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syVendorRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getVendorId(), "vendorId must not be null");
                SyVendor entity = syVendorRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "vendorId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syVendorRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getVendorId(), "vendorId must not be null");
                if (syVendorRepository.existsById(id)) syVendorRepository.deleteById(id);
            }
        }
        em.flush();
    }
}