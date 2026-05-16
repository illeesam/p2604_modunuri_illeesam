package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefund;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdRefundRepository;
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
public class OdRefundService {

    private final OdRefundRepository odRefundRepository;

    @PersistenceContext
    private EntityManager em;

    /* 환불 키조회 */
    public OdRefundDto.Item getById(String id) {
        OdRefundDto.Item dto = odRefundRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdRefundDto.Item getByIdOrNull(String id) {
        return odRefundRepository.selectById(id).orElse(null);
    }

    /* 환불 상세조회 */
    public OdRefund findById(String id) {
        return odRefundRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdRefund findByIdOrNull(String id) {
        return odRefundRepository.findById(id).orElse(null);
    }

    /* 환불 키검증 */
    public boolean existsById(String id) {
        return odRefundRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odRefundRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 환불 목록조회 */
    public List<OdRefundDto.Item> getList(OdRefundDto.Request req) {
        return odRefundRepository.selectList(req);
    }

    /* 환불 페이지조회 */
    public OdRefundDto.PageResponse getPageData(OdRefundDto.Request req) {
        PageHelper.addPaging(req);
        return odRefundRepository.selectPageList(req);
    }

    /* 환불 등록 */
    @Transactional
    public OdRefund create(OdRefund body) {
        body.setRefundId(CmUtil.generateId("od_refund"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdRefund saved = odRefundRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 환불 저장 */
    @Transactional
    public OdRefund save(OdRefund entity) {
        if (!existsById(entity.getRefundId()))
            throw new CmBizException("존재하지 않는 OdRefund입니다: " + entity.getRefundId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdRefund saved = odRefundRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 환불 수정 */
    @Transactional
    public OdRefund update(String id, OdRefund body) {
        OdRefund entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "refundId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdRefund saved = odRefundRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 환불 수정 */
    @Transactional
    public OdRefund updateSelective(OdRefund entity) {
        if (entity.getRefundId() == null) throw new CmBizException("refundId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getRefundId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getRefundId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odRefundRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 환불 삭제 */
    @Transactional
    public void delete(String id) {
        OdRefund entity = findById(id);
        odRefundRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 환불 목록저장 */
    @Transactional
    public void saveList(List<OdRefund> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getRefundId() != null)
            .map(OdRefund::getRefundId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odRefundRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdRefund> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getRefundId() != null)
            .toList();
        for (OdRefund row : updateRows) {
            OdRefund entity = findById(row.getRefundId());
            VoUtil.voCopyExclude(row, entity, "refundId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odRefundRepository.save(entity);
        }
        em.flush();

        List<OdRefund> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdRefund row : insertRows) {
            row.setRefundId(CmUtil.generateId("od_refund"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odRefundRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
