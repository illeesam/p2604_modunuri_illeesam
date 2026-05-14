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

    public OdPayDto.Item getById(String id) {
        OdPayDto.Item dto = odPayRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdPayDto.Item getByIdOrNull(String id) {
        return odPayRepository.selectById(id).orElse(null);
    }

    public OdPay findById(String id) {
        return odPayRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdPay findByIdOrNull(String id) {
        return odPayRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return odPayRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odPayRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<OdPayDto.Item> getList(OdPayDto.Request req) {
        return odPayRepository.selectList(req);
    }

    public OdPayDto.PageResponse getPageData(OdPayDto.Request req) {
        PageHelper.addPaging(req);
        return odPayRepository.selectPageList(req);
    }

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

    @Transactional
    public OdPay save(OdPay entity) {
        if (!existsById(entity.getPayId()))
            throw new CmBizException("존재하지 않는 OdPay입니다: " + entity.getPayId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdPay saved = odPayRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public OdPay update(String id, OdPay body) {
        OdPay entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "payId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdPay saved = odPayRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

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

    @Transactional
    public void delete(String id) {
        OdPay entity = findById(id);
        odPayRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<OdPay> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getPayId() != null)
            .map(OdPay::getPayId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odPayRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdPay> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getPayId() != null)
            .toList();
        for (OdPay row : updateRows) {
            OdPay entity = findById(row.getPayId());
            VoUtil.voCopyExclude(row, entity, "payId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odPayRepository.save(entity);
        }
        em.flush();

        List<OdPay> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdPay row : insertRows) {
            row.setPayId(CmUtil.generateId("od_pay"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odPayRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
