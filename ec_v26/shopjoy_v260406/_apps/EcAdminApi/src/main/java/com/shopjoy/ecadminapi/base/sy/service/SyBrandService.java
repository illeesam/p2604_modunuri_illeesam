package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBrand;
import com.shopjoy.ecadminapi.base.sy.mapper.SyBrandMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyBrandRepository;
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
public class SyBrandService {


    private final SyBrandMapper syBrandMapper;
    private final SyBrandRepository syBrandRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public SyBrandDto getById(String id) {
        // sy_brand :: select one :: id [orm:mybatis]
        SyBrandDto result = syBrandMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<SyBrandDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_brand :: select list :: p [orm:mybatis]
        List<SyBrandDto> result = syBrandMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<SyBrandDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_brand :: select page :: p [orm:mybatis]
        return PageResult.of(syBrandMapper.selectPageList(p), syBrandMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyBrand entity) {
        // sy_brand :: update :: entity [orm:mybatis]
        int result = syBrandMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyBrand create(SyBrand entity) {
        entity.setBrandId(CmUtil.generateId("sy_brand"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_brand :: insert or update :: [orm:jpa]
        SyBrand result = syBrandRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public SyBrand save(SyBrand entity) {
        if (!syBrandRepository.existsById(entity.getBrandId()))
            throw new CmBizException("존재하지 않는 SyBrand입니다: " + entity.getBrandId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_brand :: insert or update :: [orm:jpa]
        SyBrand result = syBrandRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyBrand entity = syBrandRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syBrandRepository.delete(entity);
        em.flush();
        if (syBrandRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyBrand> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyBrand row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setBrandId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_brand"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syBrandRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getBrandId(), "brandId must not be null");
                SyBrand entity = syBrandRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "brandId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syBrandRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getBrandId(), "brandId must not be null");
                if (syBrandRepository.existsById(id)) syBrandRepository.deleteById(id);
            }
        }
        em.flush();
    }
}