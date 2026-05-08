package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventItem;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmEventItemMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmEventItemRepository;
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
@Transactional(readOnly = true)
public class PmEventItemService {


    private final PmEventItemMapper pmEventItemMapper;
    private final PmEventItemRepository pmEventItemRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public PmEventItemDto getById(String id) {
        // pm_event_item :: select one :: id [orm:mybatis]
        PmEventItemDto result = pmEventItemMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<PmEventItemDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pm_event_item :: select list :: p [orm:mybatis]
        List<PmEventItemDto> result = pmEventItemMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<PmEventItemDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pm_event_item :: select page :: [orm:mybatis]
        return PageResult.of(pmEventItemMapper.selectPageList(p), pmEventItemMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(PmEventItem entity) {
        // pm_event_item :: update :: [orm:mybatis]
        int result = pmEventItemMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmEventItem create(PmEventItem entity) {
        entity.setEventItemId(CmUtil.generateId("pm_event_item"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_event_item :: insert or update :: [orm:jpa]
        PmEventItem result = pmEventItemRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public PmEventItem save(PmEventItem entity) {
        if (!pmEventItemRepository.existsById(entity.getEventItemId()))
            throw new CmBizException("존재하지 않는 PmEventItem입니다: " + entity.getEventItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_event_item :: insert or update :: [orm:jpa]
        PmEventItem result = pmEventItemRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!pmEventItemRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PmEventItem입니다: " + id);
        // pm_event_item :: delete :: id [orm:jpa]
        pmEventItemRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PmEventItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PmEventItem row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setEventItemId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pm_event_item"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmEventItemRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getEventItemId(), "eventItemId must not be null");
                PmEventItem entity = pmEventItemRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "eventItemId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pmEventItemRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getEventItemId(), "eventItemId must not be null");
                if (pmEventItemRepository.existsById(id)) pmEventItemRepository.deleteById(id);
            }
        }
    }
}