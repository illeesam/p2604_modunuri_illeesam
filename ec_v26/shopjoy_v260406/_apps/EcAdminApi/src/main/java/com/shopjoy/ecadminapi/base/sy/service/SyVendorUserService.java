package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUser;
import com.shopjoy.ecadminapi.base.sy.mapper.SyVendorUserMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorUserRepository;
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
public class SyVendorUserService {


    private final SyVendorUserMapper syVendorUserMapper;
    private final SyVendorUserRepository syVendorUserRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyVendorUserDto getById(String id) {
        // sy_vendor_user :: select one :: id [orm:mybatis]
        SyVendorUserDto result = syVendorUserMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<SyVendorUserDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_vendor_user :: select list :: p [orm:mybatis]
        List<SyVendorUserDto> result = syVendorUserMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<SyVendorUserDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_vendor_user :: select page :: p [orm:mybatis]
        return PageResult.of(syVendorUserMapper.selectPageList(p), syVendorUserMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyVendorUser entity) {
        // sy_vendor_user :: update :: entity [orm:mybatis]
        int result = syVendorUserMapper.updateSelective(entity);
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
        SyVendorUser result = syVendorUserRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public SyVendorUser save(SyVendorUser entity) {
        if (!syVendorUserRepository.existsById(entity.getVendorUserId()))
            throw new CmBizException("존재하지 않는 SyVendorUser입니다: " + entity.getVendorUserId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_vendor_user :: insert or update :: [orm:jpa]
        SyVendorUser result = syVendorUserRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyVendorUser entity = syVendorUserRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syVendorUserRepository.delete(entity);
        em.flush();
        if (syVendorUserRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyVendorUser> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyVendorUser row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setVendorUserId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_vendor_user"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syVendorUserRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getVendorUserId(), "vendorUserId must not be null");
                SyVendorUser entity = syVendorUserRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "vendorUserId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syVendorUserRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getVendorUserId(), "vendorUserId must not be null");
                if (syVendorUserRepository.existsById(id)) syVendorUserRepository.deleteById(id);
            }
        }
        em.flush();
    }
}