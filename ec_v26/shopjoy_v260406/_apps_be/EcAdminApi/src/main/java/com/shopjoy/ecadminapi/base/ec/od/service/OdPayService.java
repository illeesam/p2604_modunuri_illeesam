package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPay;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdPayRepository;
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
public class OdPayService {

    private final OdPayRepository odPayRepository;

    @PersistenceContext
    private EntityManager em;

    /* 결제 키조회 */
    public OdPayDto.Item getById(String id) {
        OdPayDto.Item dto = odPayRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdPayDto.Item getByIdOrNull(String id) {
        return odPayRepository.selectById(id).orElse(null);
    }

    /* 결제 상세조회 */
    public OdPay findById(String id) {
        return odPayRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdPay findByIdOrNull(String id) {
        return odPayRepository.findById(id).orElse(null);
    }

    /* 결제 키검증 */
    public boolean existsById(String id) {
        return odPayRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odPayRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 결제 목록조회 */
    public List<OdPayDto.Item> getList(OdPayDto.Request req) {
        return odPayRepository.selectList(req);
    }

    /* 결제 페이지조회 */
    public OdPayDto.PageResponse getPageData(OdPayDto.Request req) {
        PageHelper.addPaging(req);
        return odPayRepository.selectPageData(req);
    }

    /* 결제 등록 */
    @Transactional
    public OdPay create(OdPay body) {
        body.setPayId(CmUtil.generateId("od_pay"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdPay saved = odPayRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 결제 수정 */
    @Transactional
    public OdPay update(String id, OdPay body) {
        CmUtil.requireId(id, "id", this);
        OdPay entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "payId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdPay saved = odPayRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 결제 수정 */
    @Transactional
    public OdPay updateSelective(OdPay entity) {
        if (entity.getPayId() == null) throw new CmBizException("payId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getPayId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPayId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odPayRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 결제 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        OdPay entity = findById(id);
        odPayRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public OdPay saveOneBase(OdPay entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getPayId() == null || entity.getPayId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getPayId() == null)
                throw new CmBizException("삭제 대상 payId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!odPayRepository.existsById(entity.getPayId()))
                throw new CmBizException("존재하지 않는 OdPay입니다: " + entity.getPayId() + "::" + CmUtil.svcCallerInfo(this));
            odPayRepository.deleteById(entity.getPayId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setPayId(CmUtil.generateId("od_pay"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            OdPay saved = odPayRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getPayId() == null)
                throw new CmBizException("수정 대상 payId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = odPayRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 OdPay입니다: " + entity.getPayId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getPayId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<OdPay> rows) {
        /* 0단계: rowStatus 정규화 */
        for (OdPay row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getPayId() == null || row.getPayId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, OdPay::getPayId, "U", "payId", this);
        CmUtil.requireRowIds(rows, OdPay::getPayId, "D", "payId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(OdPay::getPayId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odPayRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<OdPay> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (OdPay row : updateRows) {
            row.setUpdBy(authId);
            int affected = odPayRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getPayId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<OdPay> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdPay row : insertRows) {
            row.setPayId(CmUtil.generateId("od_pay"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odPayRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
