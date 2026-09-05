package com.shopjoy.ecBeBo.base.ec.pm.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmPlanItemDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmPlanItem;
import com.shopjoy.ecBeBo.base.ec.pm.repository.PmPlanItemRepository;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.util.PageHelper;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import com.shopjoy.ecBeBo.common.util.VoUtil;
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
        // [QueryDSL] 기획전 상품 단건 조회
        PmPlanItemDto.Item dto = pmPlanItemRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmPlanItemDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 기획전 상품 단건 조회
        return pmPlanItemRepository.selectById(id).orElse(null);
    }

    /* 프로모션 플랜 아이템 상세조회 */
    public PmPlanItem findById(String id) {
        // [쿼리 메서드] 기획전 상품 단건 조회
        return pmPlanItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmPlanItem findByIdOrNull(String id) {
        // [쿼리 메서드] 기획전 상품 단건 조회
        return pmPlanItemRepository.findById(id).orElse(null);
    }

    /* 프로모션 플랜 아이템 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 기획전 상품 존재 여부 확인
        return pmPlanItemRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 기획전 상품 존재 여부 확인
        if (!pmPlanItemRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 프로모션 플랜 아이템 목록조회 */
    public List<PmPlanItemDto.Item> getList(PmPlanItemDto.Request req) {
        // [QueryDSL] 기획전 상품 목록 조회
        return pmPlanItemRepository.selectList(req);
    }

    /* 프로모션 플랜 아이템 페이지조회 */
    public BasePage<PmPlanItemDto.Item> getPageData(PmPlanItemDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 기획전 상품 페이지 조회
        return pmPlanItemRepository.selectPageData(req);
    }

    /* 프로모션 플랜 아이템 등록 */
    @Transactional
    public PmPlanItem create(PmPlanItem body) {
        body.setPlanItemId(CmUtil.generateId("pm_plan_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 기획전 상품 저장
        PmPlanItem saved = pmPlanItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 프로모션 플랜 아이템 수정 */
    @Transactional
    public PmPlanItem update(String id, PmPlanItem body) {
        CmUtil.requireId(id, "id", this);
        PmPlanItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "planItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 기획전 상품 저장
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
        // [QueryDSL] 기획전 상품 선택적 필드 수정
        int affected = pmPlanItemRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 프로모션 플랜 아이템 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmPlanItem entity = findById(id);
        // [쿼리 메서드] 기획전 상품 삭제
        pmPlanItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmPlanItem saveOneBase(PmPlanItem entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getPlanItemId());

        if ("D".equals(rowStatus)) {
            if (entity.getPlanItemId() == null)
                throw new CmBizException("삭제 대상 planItemId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 기획전 상품 존재 여부 확인
            if (!pmPlanItemRepository.existsById(entity.getPlanItemId()))
                throw new CmBizException("존재하지 않는 PmPlanItem입니다: " + entity.getPlanItemId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 기획전 상품 ID 기준 삭제
            pmPlanItemRepository.deleteById(entity.getPlanItemId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setPlanItemId(CmUtil.generateId("pm_plan_item"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 기획전 상품 저장
            PmPlanItem saved = pmPlanItemRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getPlanItemId() == null)
                throw new CmBizException("수정 대상 planItemId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 기획전 상품 선택적 필드 수정
            int affected = pmPlanItemRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PmPlanItem입니다: " + entity.getPlanItemId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getPlanItemId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PmPlanItem> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PmPlanItem row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getPlanItemId() == null || row.getPlanItemId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PmPlanItem::getPlanItemId, "U", "planItemId", this);
        CmUtil.requireRowIds(rows, PmPlanItem::getPlanItemId, "D", "planItemId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PmPlanItem::getPlanItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 기획전 상품 조건별 삭제
            pmPlanItemRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PmPlanItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PmPlanItem row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 기획전 상품 선택적 필드 수정
            int affected = pmPlanItemRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getPlanItemId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PmPlanItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmPlanItem row : insertRows) {
            row.setPlanItemId(CmUtil.generateId("pm_plan_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 기획전 상품 저장
            pmPlanItemRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
