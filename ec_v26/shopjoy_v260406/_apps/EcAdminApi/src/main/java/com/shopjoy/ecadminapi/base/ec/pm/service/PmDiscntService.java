package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscnt;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmDiscntMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmDiscntRepository;
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
public class PmDiscntService {


    private final PmDiscntMapper pmDiscntMapper;
    private final PmDiscntRepository pmDiscntRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmDiscntDto getById(String id) {
        // pm_discnt :: select one :: id [orm:mybatis]
        PmDiscntDto result = pmDiscntMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<PmDiscntDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pm_discnt :: select list :: p [orm:mybatis]
        List<PmDiscntDto> result = pmDiscntMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<PmDiscntDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pm_discnt :: select page :: [orm:mybatis]
        return PageResult.of(pmDiscntMapper.selectPageList(p), pmDiscntMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(PmDiscnt entity) {
        // pm_discnt :: update :: [orm:mybatis]
        int result = pmDiscntMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmDiscnt create(PmDiscnt entity) {
        entity.setDiscntId(CmUtil.generateId("pm_discnt"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_discnt :: insert or update :: [orm:jpa]
        PmDiscnt result = pmDiscntRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public PmDiscnt save(PmDiscnt entity) {
        if (!pmDiscntRepository.existsById(entity.getDiscntId()))
            throw new CmBizException("존재하지 않는 PmDiscnt입니다: " + entity.getDiscntId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_discnt :: insert or update :: [orm:jpa]
        PmDiscnt result = pmDiscntRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!pmDiscntRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PmDiscnt입니다: " + id);
        // pm_discnt :: delete :: id [orm:jpa]
        pmDiscntRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PmDiscnt> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PmDiscnt row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setDiscntId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pm_discnt"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmDiscntRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getDiscntId(), "discntId must not be null");
                PmDiscnt entity = pmDiscntRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "discntId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pmDiscntRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getDiscntId(), "discntId must not be null");
                if (pmDiscntRepository.existsById(id)) pmDiscntRepository.deleteById(id);
            }
        }
    }
}