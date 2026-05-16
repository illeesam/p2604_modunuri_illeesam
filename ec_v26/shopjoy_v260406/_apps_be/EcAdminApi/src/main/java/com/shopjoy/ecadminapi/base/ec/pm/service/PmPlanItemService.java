package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlanItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmPlanItemRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PmPlanItemService {

    private final PmPlanItemRepository pmPlanItemRepository;

    @PersistenceContext
    private EntityManager em;

    /* 프로모션 플랜 아이템 키조회 */
    public PmPlanItemDto.Item getById(String id) {
        PmPlanItemDto.Item dto = pmPlanItemRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmPlanItemDto.Item getByIdOrNull(String id) {
        return pmPlanItemRepository.selectById(id).orElse(null);
    }

    /* 프로모션 플랜 아이템 상세조회 */
    public PmPlanItem findById(String id) {
        return pmPlanItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmPlanItem findByIdOrNull(String id) {
        return pmPlanItemRepository.findById(id).orElse(null);
    }

    /* 프로모션 플랜 아이템 키검증 */
    public boolean existsById(String id) {
        return pmPlanItemRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmPlanItemRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 프로모션 플랜 아이템 목록조회 */
    public List<PmPlanItemDto.Item> getList(PmPlanItemDto.Request req) {
        return pmPlanItemRepository.selectList(req);
    }

    /* 프로모션 플랜 아이템 페이지조회 */
    public PmPlanItemDto.PageResponse getPageData(PmPlanItemDto.Request req) {
        PageHelper.addPaging(req);
        return pmPlanItemRepository.selectPageList(req);
    }

    /* 프로모션 플랜 아이템 등록 */
    @Transactional
    public PmPlanItem create(PmPlanItem body) {
        body.setPlanItemId(CmUtil.generateId("pm_plan_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmPlanItem saved = pmPlanItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 프로모션 플랜 아이템 저장 */
    @Transactional
    public PmPlanItem save(PmPlanItem entity) {
        if (!existsById(entity.getPlanItemId()))
            throw new CmBizException("존재하지 않는 PmPlanItem입니다: " + entity.getPlanItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmPlanItem saved = pmPlanItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 프로모션 플랜 아이템 수정 */
    @Transactional
    public PmPlanItem update(String id, PmPlanItem body) {
        PmPlanItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "planItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmPlanItem saved = pmPlanItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 프로모션 플랜 아이템 수정 */
    @Transactional
    public PmPlanItem updateSelective(PmPlanItem entity) {
        if (entity.getPlanItemId() == null) throw new CmBizException("planItemId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getPlanItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPlanItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmPlanItemRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 프로모션 플랜 아이템 삭제 */
    @Transactional
    public void delete(String id) {
        PmPlanItem entity = findById(id);
        pmPlanItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 프로모션 플랜 아이템 목록저장 */
    @Transactional
    public void saveList(List<PmPlanItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getPlanItemId() != null)
            .map(PmPlanItem::getPlanItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmPlanItemRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmPlanItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getPlanItemId() != null)
            .toList();
        for (PmPlanItem row : updateRows) {
            PmPlanItem entity = findById(row.getPlanItemId());
            VoUtil.voCopyExclude(row, entity, "planItemId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmPlanItemRepository.save(entity);
        }
        em.flush();

        List<PmPlanItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmPlanItem row : insertRows) {
            row.setPlanItemId(CmUtil.generateId("pm_plan_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmPlanItemRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
