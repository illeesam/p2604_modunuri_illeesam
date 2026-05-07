package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18n;
import com.shopjoy.ecadminapi.base.sy.mapper.SyI18nMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyI18nRepository;
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
public class SyI18nService {


    private final SyI18nMapper syI18nMapper;
    private final SyI18nRepository syI18nRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyI18nDto getById(String id) {
        // sy_i18n :: select one :: id [orm:mybatis]
        SyI18nDto result = syI18nMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<SyI18nDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_i18n :: select list :: p [orm:mybatis]
        List<SyI18nDto> result = syI18nMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<SyI18nDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_i18n :: select page :: p [orm:mybatis]
        return PageResult.of(syI18nMapper.selectPageList(p), syI18nMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyI18n entity) {
        // sy_i18n :: update :: entity [orm:mybatis]
        int result = syI18nMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyI18n create(SyI18n entity) {
        entity.setI18nId(CmUtil.generateId("sy_i18n"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_i18n :: insert or update :: [orm:jpa]
        SyI18n result = syI18nRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public SyI18n save(SyI18n entity) {
        if (!syI18nRepository.existsById(entity.getI18nId()))
            throw new CmBizException("존재하지 않는 SyI18n입니다: " + entity.getI18nId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_i18n :: insert or update :: [orm:jpa]
        SyI18n result = syI18nRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyI18n entity = syI18nRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syI18nRepository.delete(entity);
        em.flush();
        if (syI18nRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyI18n> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyI18n row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setI18nId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_i18n"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syI18nRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getI18nId(), "i18nId must not be null");
                SyI18n entity = syI18nRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "i18nId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syI18nRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getI18nId(), "i18nId must not be null");
                if (syI18nRepository.existsById(id)) syI18nRepository.deleteById(id);
            }
        }
        em.flush();
    }
}