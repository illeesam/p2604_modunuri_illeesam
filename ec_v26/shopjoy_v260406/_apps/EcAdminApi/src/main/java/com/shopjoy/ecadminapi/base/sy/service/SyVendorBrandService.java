package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorBrand;
import com.shopjoy.ecadminapi.base.sy.mapper.SyVendorBrandMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorBrandRepository;
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
@Transactional(readOnly = true)
public class SyVendorBrandService {


    private final SyVendorBrandMapper syVendorBrandMapper;
    private final SyVendorBrandRepository syVendorBrandRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public SyVendorBrandDto getById(String id) {
        // sy_vendor_brand :: select one :: id [orm:mybatis]
        SyVendorBrandDto result = syVendorBrandMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<SyVendorBrandDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_vendor_brand :: select list :: p [orm:mybatis]
        List<SyVendorBrandDto> result = syVendorBrandMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<SyVendorBrandDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_vendor_brand :: select page :: p [orm:mybatis]
        return PageResult.of(syVendorBrandMapper.selectPageList(p), syVendorBrandMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyVendorBrand entity) {
        // sy_vendor_brand :: update :: entity [orm:mybatis]
        int result = syVendorBrandMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyVendorBrand create(SyVendorBrand entity) {
        entity.setVendorBrandId(CmUtil.generateId("sy_vendor_brand"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_vendor_brand :: insert or update :: [orm:jpa]
        SyVendorBrand result = syVendorBrandRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public SyVendorBrand save(SyVendorBrand entity) {
        if (!syVendorBrandRepository.existsById(entity.getVendorBrandId()))
            throw new CmBizException("존재하지 않는 SyVendorBrand입니다: " + entity.getVendorBrandId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_vendor_brand :: insert or update :: [orm:jpa]
        SyVendorBrand result = syVendorBrandRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyVendorBrand entity = syVendorBrandRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syVendorBrandRepository.delete(entity);
        em.flush();
        if (syVendorBrandRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyVendorBrand> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyVendorBrand row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setVendorBrandId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_vendor_brand"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syVendorBrandRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getVendorBrandId(), "vendorBrandId must not be null");
                SyVendorBrand entity = syVendorBrandRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "vendorBrandId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syVendorBrandRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getVendorBrandId(), "vendorBrandId must not be null");
                if (syVendorBrandRepository.existsById(id)) syVendorBrandRepository.deleteById(id);
            }
        }
        em.flush();
    }
}