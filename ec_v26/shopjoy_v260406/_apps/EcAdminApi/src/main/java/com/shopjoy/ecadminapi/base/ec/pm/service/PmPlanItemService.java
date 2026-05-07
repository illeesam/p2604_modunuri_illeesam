package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlanItem;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmPlanItemMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmPlanItemRepository;
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
public class PmPlanItemService {


    private final PmPlanItemMapper pmPlanItemMapper;
    private final PmPlanItemRepository pmPlanItemRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmPlanItemDto getById(String id) {
        PmPlanItemDto result = pmPlanItemMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<PmPlanItemDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<PmPlanItemDto> result = pmPlanItemMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<PmPlanItemDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(pmPlanItemMapper.selectPageList(p), pmPlanItemMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(PmPlanItem entity) {
        int result = pmPlanItemMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmPlanItem create(PmPlanItem entity) {
        entity.setPlanItemId(CmUtil.generateId("pm_plan_item"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmPlanItem result = pmPlanItemRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public PmPlanItem save(PmPlanItem entity) {
        if (!pmPlanItemRepository.existsById(entity.getPlanItemId()))
            throw new CmBizException("존재하지 않는 PmPlanItem입니다: " + entity.getPlanItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmPlanItem result = pmPlanItemRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!pmPlanItemRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PmPlanItem입니다: " + id);
        pmPlanItemRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PmPlanItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PmPlanItem row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setPlanItemId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pm_plan_item"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmPlanItemRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getPlanItemId(), "planItemId must not be null");
                PmPlanItem entity = pmPlanItemRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "planItemId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pmPlanItemRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getPlanItemId(), "planItemId must not be null");
                if (pmPlanItemRepository.existsById(id)) pmPlanItemRepository.deleteById(id);
            }
        }
    }
}