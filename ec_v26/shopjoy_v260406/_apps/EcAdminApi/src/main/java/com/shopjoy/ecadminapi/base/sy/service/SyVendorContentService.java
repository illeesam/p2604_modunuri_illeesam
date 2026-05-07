package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorContentDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorContent;
import com.shopjoy.ecadminapi.base.sy.mapper.SyVendorContentMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorContentRepository;
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
public class SyVendorContentService {


    private final SyVendorContentMapper syVendorContentMapper;
    private final SyVendorContentRepository syVendorContentRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyVendorContentDto getById(String id) {
        // sy_vendor_content :: select one :: id [orm:mybatis]
        SyVendorContentDto result = syVendorContentMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<SyVendorContentDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_vendor_content :: select list :: p [orm:mybatis]
        List<SyVendorContentDto> result = syVendorContentMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<SyVendorContentDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_vendor_content :: select page :: p [orm:mybatis]
        return PageResult.of(syVendorContentMapper.selectPageList(p), syVendorContentMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyVendorContent entity) {
        // sy_vendor_content :: update :: entity [orm:mybatis]
        int result = syVendorContentMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyVendorContent create(SyVendorContent entity) {
        entity.setVendorContentId(CmUtil.generateId("sy_vendor_content"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_vendor_content :: insert or update :: [orm:jpa]
        SyVendorContent result = syVendorContentRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public SyVendorContent save(SyVendorContent entity) {
        if (!syVendorContentRepository.existsById(entity.getVendorContentId()))
            throw new CmBizException("존재하지 않는 SyVendorContent입니다: " + entity.getVendorContentId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_vendor_content :: insert or update :: [orm:jpa]
        SyVendorContent result = syVendorContentRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyVendorContent entity = syVendorContentRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syVendorContentRepository.delete(entity);
        em.flush();
        if (syVendorContentRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyVendorContent> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyVendorContent row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setVendorContentId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_vendor_content"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syVendorContentRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getVendorContentId(), "vendorContentId must not be null");
                SyVendorContent entity = syVendorContentRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "vendorContentId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syVendorContentRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getVendorContentId(), "vendorContentId must not be null");
                if (syVendorContentRepository.existsById(id)) syVendorContentRepository.deleteById(id);
            }
        }
        em.flush();
    }
}