package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmPlanRepository;
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
public class PmPlanService {

    private final PmPlanRepository pmPlanRepository;

    @PersistenceContext
    private EntityManager em;

    /* 프로모션 플랜 키조회 */
    public PmPlanDto.Item getById(String id) {
        PmPlanDto.Item dto = pmPlanRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmPlanDto.Item getByIdOrNull(String id) {
        return pmPlanRepository.selectById(id).orElse(null);
    }

    /* 프로모션 플랜 상세조회 */
    public PmPlan findById(String id) {
        return pmPlanRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmPlan findByIdOrNull(String id) {
        return pmPlanRepository.findById(id).orElse(null);
    }

    /* 프로모션 플랜 키검증 */
    public boolean existsById(String id) {
        return pmPlanRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmPlanRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 프로모션 플랜 목록조회 */
    public List<PmPlanDto.Item> getList(PmPlanDto.Request req) {
        return pmPlanRepository.selectList(req);
    }

    /* 프로모션 플랜 페이지조회 */
    public PmPlanDto.PageResponse getPageData(PmPlanDto.Request req) {
        PageHelper.addPaging(req);
        return pmPlanRepository.selectPageData(req);
    }

    /* 프로모션 플랜 등록 */
    @Transactional
    public PmPlan create(PmPlan body) {
        body.setPlanId(CmUtil.generateId("pm_plan"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmPlan saved = pmPlanRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 프로모션 플랜 수정 */
    @Transactional
    public PmPlan update(String id, PmPlan body) {
        CmUtil.requireId(id, "id", this);
        PmPlan entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "planId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmPlan saved = pmPlanRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 프로모션 플랜 수정 */
    @Transactional
    public PmPlan updateSelective(PmPlan entity) {
        if (entity.getPlanId() == null) throw new CmBizException("planId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getPlanId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPlanId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmPlanRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 프로모션 플랜 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmPlan entity = findById(id);
        pmPlanRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmPlan saveOneBase(PmPlan entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getPlanId() == null || entity.getPlanId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getPlanId() == null)
                throw new CmBizException("삭제 대상 planId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!pmPlanRepository.existsById(entity.getPlanId()))
                throw new CmBizException("존재하지 않는 PmPlan입니다: " + entity.getPlanId() + "::" + CmUtil.svcCallerInfo(this));
            pmPlanRepository.deleteById(entity.getPlanId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setPlanId(CmUtil.generateId("pm_plan"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            PmPlan saved = pmPlanRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getPlanId() == null)
                throw new CmBizException("수정 대상 planId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = pmPlanRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PmPlan입니다: " + entity.getPlanId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getPlanId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PmPlan> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PmPlan row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getPlanId() == null || row.getPlanId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PmPlan::getPlanId, "U", "planId", this);
        CmUtil.requireRowIds(rows, PmPlan::getPlanId, "D", "planId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PmPlan::getPlanId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmPlanRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PmPlan> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PmPlan row : updateRows) {
            row.setUpdBy(authId);
            int affected = pmPlanRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getPlanId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PmPlan> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmPlan row : insertRows) {
            row.setPlanId(CmUtil.generateId("pm_plan"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmPlanRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
