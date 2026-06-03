package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdRestockNotiDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdRestockNoti;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdRestockNotiRepository;
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
public class PdRestockNotiService {

    private final PdRestockNotiRepository pdRestockNotiRepository;

    @PersistenceContext
    private EntityManager em;

    /* 재입고 알림 키조회 */
    public PdRestockNotiDto.Item getById(String id) {
        PdRestockNotiDto.Item dto = pdRestockNotiRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdRestockNotiDto.Item getByIdOrNull(String id) {
        return pdRestockNotiRepository.selectById(id).orElse(null);
    }

    /* 재입고 알림 상세조회 */
    public PdRestockNoti findById(String id) {
        return pdRestockNotiRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdRestockNoti findByIdOrNull(String id) {
        return pdRestockNotiRepository.findById(id).orElse(null);
    }

    /* 재입고 알림 키검증 */
    public boolean existsById(String id) {
        return pdRestockNotiRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdRestockNotiRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 재입고 알림 목록조회 */
    public List<PdRestockNotiDto.Item> getList(PdRestockNotiDto.Request req) {
        return pdRestockNotiRepository.selectList(req);
    }

    /* 재입고 알림 페이지조회 */
    public PdRestockNotiDto.PageResponse getPageData(PdRestockNotiDto.Request req) {
        PageHelper.addPaging(req);
        return pdRestockNotiRepository.selectPageData(req);
    }

    /* 재입고 알림 등록 */
    @Transactional
    public PdRestockNoti create(PdRestockNoti body) {
        body.setRestockNotiId(CmUtil.generateId("pd_restock_noti"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdRestockNoti saved = pdRestockNotiRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 재입고 알림 수정 */
    @Transactional
    public PdRestockNoti update(String id, PdRestockNoti body) {
        CmUtil.requireId(id, "id", this);
        PdRestockNoti entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "restockNotiId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdRestockNoti saved = pdRestockNotiRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 재입고 알림 수정 */
    @Transactional
    public PdRestockNoti updateSelective(PdRestockNoti entity) {
        if (entity.getRestockNotiId() == null) throw new CmBizException("restockNotiId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getRestockNotiId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getRestockNotiId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdRestockNotiRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 재입고 알림 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdRestockNoti entity = findById(id);
        pdRestockNotiRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PdRestockNoti saveOneBase(PdRestockNoti entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getRestockNotiId() == null || entity.getRestockNotiId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getRestockNotiId() == null)
                throw new CmBizException("삭제 대상 restockNotiId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!pdRestockNotiRepository.existsById(entity.getRestockNotiId()))
                throw new CmBizException("존재하지 않는 PdRestockNoti입니다: " + entity.getRestockNotiId() + "::" + CmUtil.svcCallerInfo(this));
            pdRestockNotiRepository.deleteById(entity.getRestockNotiId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setRestockNotiId(CmUtil.generateId("pd_restock_noti"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            PdRestockNoti saved = pdRestockNotiRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getRestockNotiId() == null)
                throw new CmBizException("수정 대상 restockNotiId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = pdRestockNotiRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PdRestockNoti입니다: " + entity.getRestockNotiId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getRestockNotiId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PdRestockNoti> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PdRestockNoti row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getRestockNotiId() == null || row.getRestockNotiId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PdRestockNoti::getRestockNotiId, "U", "restockNotiId", this);
        CmUtil.requireRowIds(rows, PdRestockNoti::getRestockNotiId, "D", "restockNotiId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PdRestockNoti::getRestockNotiId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdRestockNotiRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PdRestockNoti> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PdRestockNoti row : updateRows) {
            row.setUpdBy(authId);
            int affected = pdRestockNotiRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getRestockNotiId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PdRestockNoti> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdRestockNoti row : insertRows) {
            row.setRestockNotiId(CmUtil.generateId("pd_restock_noti"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdRestockNotiRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
