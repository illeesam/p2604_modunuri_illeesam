package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmEventMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmEventRepository;
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
public class PmEventService {


    private final PmEventMapper pmEventMapper;
    private final PmEventRepository pmEventRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmEventDto getById(String id) {
        // pm_event :: select one :: id [orm:mybatis]
        PmEventDto result = pmEventMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<PmEventDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pm_event :: select list :: p [orm:mybatis]
        List<PmEventDto> result = pmEventMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<PmEventDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pm_event :: select page :: [orm:mybatis]
        return PageResult.of(pmEventMapper.selectPageList(p), pmEventMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(PmEvent entity) {
        // pm_event :: update :: [orm:mybatis]
        int result = pmEventMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmEvent create(PmEvent entity) {
        entity.setEventId(CmUtil.generateId("pm_event"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_event :: insert or update :: [orm:jpa]
        PmEvent result = pmEventRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public PmEvent save(PmEvent entity) {
        if (!pmEventRepository.existsById(entity.getEventId()))
            throw new CmBizException("존재하지 않는 PmEvent입니다: " + entity.getEventId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_event :: insert or update :: [orm:jpa]
        PmEvent result = pmEventRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!pmEventRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PmEvent입니다: " + id);
        // pm_event :: delete :: id [orm:jpa]
        pmEventRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PmEvent> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PmEvent row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setEventId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pm_event"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmEventRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getEventId(), "eventId must not be null");
                PmEvent entity = pmEventRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "eventId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pmEventRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getEventId(), "eventId must not be null");
                if (pmEventRepository.existsById(id)) pmEventRepository.deleteById(id);
            }
        }
    }
}