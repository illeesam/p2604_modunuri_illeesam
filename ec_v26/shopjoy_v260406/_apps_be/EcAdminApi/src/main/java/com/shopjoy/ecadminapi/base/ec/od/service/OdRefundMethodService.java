package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefundMethod;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdRefundMethodRepository;
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
public class OdRefundMethodService {

    private final OdRefundMethodRepository odRefundMethodRepository;

    @PersistenceContext
    private EntityManager em;

    /* 환불수단 키조회 */
    public OdRefundMethodDto.Item getById(String id) {
        OdRefundMethodDto.Item dto = odRefundMethodRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdRefundMethodDto.Item getByIdOrNull(String id) {
        return odRefundMethodRepository.selectById(id).orElse(null);
    }

    /* 환불수단 상세조회 */
    public OdRefundMethod findById(String id) {
        return odRefundMethodRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdRefundMethod findByIdOrNull(String id) {
        return odRefundMethodRepository.findById(id).orElse(null);
    }

    /* 환불수단 키검증 */
    public boolean existsById(String id) {
        return odRefundMethodRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odRefundMethodRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 환불수단 목록조회 */
    public List<OdRefundMethodDto.Item> getList(OdRefundMethodDto.Request req) {
        return odRefundMethodRepository.selectList(req);
    }

    /* 환불수단 페이지조회 */
    public OdRefundMethodDto.PageResponse getPageData(OdRefundMethodDto.Request req) {
        PageHelper.addPaging(req);
        return odRefundMethodRepository.selectPageList(req);
    }

    /* 환불수단 등록 */
    @Transactional
    public OdRefundMethod create(OdRefundMethod body) {
        body.setRefundMethodId(CmUtil.generateId("od_refund_method"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdRefundMethod saved = odRefundMethodRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 환불수단 수정 */
    @Transactional
    public OdRefundMethod update(String id, OdRefundMethod body) {
        CmUtil.requireId(id, "id", this);
        OdRefundMethod entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "refundMethodId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdRefundMethod saved = odRefundMethodRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 환불수단 수정 */
    @Transactional
    public OdRefundMethod updateSelective(OdRefundMethod entity) {
        if (entity.getRefundMethodId() == null) throw new CmBizException("refundMethodId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getRefundMethodId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getRefundMethodId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odRefundMethodRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 환불수단 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        OdRefundMethod entity = findById(id);
        odRefundMethodRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public OdRefundMethod save(String cmd, OdRefundMethod entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getRefundMethodId() == null || entity.getRefundMethodId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getRefundMethodId() == null)
                    throw new CmBizException("삭제 대상 refundMethodId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!odRefundMethodRepository.existsById(entity.getRefundMethodId()))
                    throw new CmBizException("존재하지 않는 OdRefundMethod입니다: " + entity.getRefundMethodId() + "::" + CmUtil.svcCallerInfo(this));
                odRefundMethodRepository.deleteById(entity.getRefundMethodId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setRefundMethodId(CmUtil.generateId("od_refund_method"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                OdRefundMethod saved = odRefundMethodRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getRefundMethodId() == null)
                    throw new CmBizException("수정 대상 refundMethodId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = odRefundMethodRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 OdRefundMethod입니다: " + entity.getRefundMethodId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getRefundMethodId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<OdRefundMethod> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (OdRefundMethod row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getRefundMethodId() == null || row.getRefundMethodId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, OdRefundMethod::getRefundMethodId, "U", "refundMethodId", this);
            CmUtil.requireRowIds(rows, OdRefundMethod::getRefundMethodId, "D", "refundMethodId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(OdRefundMethod::getRefundMethodId)
                .toList();
            if (!deleteIds.isEmpty()) {
                odRefundMethodRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<OdRefundMethod> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (OdRefundMethod row : updateRows) {
                row.setUpdBy(authId);
                int affected = odRefundMethodRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getRefundMethodId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<OdRefundMethod> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (OdRefundMethod row : insertRows) {
                row.setRefundMethodId(CmUtil.generateId("od_refund_method"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                odRefundMethodRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
