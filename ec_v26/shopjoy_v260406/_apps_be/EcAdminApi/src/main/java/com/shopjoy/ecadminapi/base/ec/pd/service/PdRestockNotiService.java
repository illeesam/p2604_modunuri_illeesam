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
        return pdRestockNotiRepository.selectPageList(req);
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

    /* 재입고 알림 저장 */
    @Transactional
    public PdRestockNoti save(PdRestockNoti entity) {
        if (!existsById(entity.getRestockNotiId()))
            throw new CmBizException("존재하지 않는 PdRestockNoti입니다: " + entity.getRestockNotiId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdRestockNoti saved = pdRestockNotiRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 재입고 알림 수정 */
    @Transactional
    public PdRestockNoti update(String id, PdRestockNoti body) {
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
        PdRestockNoti entity = findById(id);
        pdRestockNotiRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 재입고 알림 목록저장 */
    @Transactional
    public void saveList(List<PdRestockNoti> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getRestockNotiId() != null)
            .map(PdRestockNoti::getRestockNotiId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdRestockNotiRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdRestockNoti> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getRestockNotiId() != null)
            .toList();
        for (PdRestockNoti row : updateRows) {
            PdRestockNoti entity = findById(row.getRestockNotiId());
            VoUtil.voCopyExclude(row, entity, "restockNotiId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdRestockNotiRepository.save(entity);
        }
        em.flush();

        List<PdRestockNoti> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdRestockNoti row : insertRows) {
            row.setRestockNotiId(CmUtil.generateId("pd_restock_noti"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdRestockNotiRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
