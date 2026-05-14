package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhClaimChgHistRepository;
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
public class OdhClaimChgHistService {

    private final OdhClaimChgHistRepository odhClaimChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    public OdhClaimChgHistDto.Item getById(String id) {
        OdhClaimChgHistDto.Item dto = odhClaimChgHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhClaimChgHistDto.Item getByIdOrNull(String id) {
        return odhClaimChgHistRepository.selectById(id).orElse(null);
    }

    public OdhClaimChgHist findById(String id) {
        return odhClaimChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhClaimChgHist findByIdOrNull(String id) {
        return odhClaimChgHistRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return odhClaimChgHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odhClaimChgHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<OdhClaimChgHistDto.Item> getList(OdhClaimChgHistDto.Request req) {
        return odhClaimChgHistRepository.selectList(req);
    }

    public OdhClaimChgHistDto.PageResponse getPageData(OdhClaimChgHistDto.Request req) {
        PageHelper.addPaging(req);
        return odhClaimChgHistRepository.selectPageList(req);
    }

    @Transactional
    public OdhClaimChgHist create(OdhClaimChgHist body) {
        body.setClaimChgHistId(CmUtil.generateId("odh_claim_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhClaimChgHist saved = odhClaimChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public OdhClaimChgHist save(OdhClaimChgHist entity) {
        if (!existsById(entity.getClaimChgHistId()))
            throw new CmBizException("존재하지 않는 OdhClaimChgHist입니다: " + entity.getClaimChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhClaimChgHist saved = odhClaimChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public OdhClaimChgHist update(String id, OdhClaimChgHist body) {
        OdhClaimChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "claimChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhClaimChgHist saved = odhClaimChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public OdhClaimChgHist updateSelective(OdhClaimChgHist entity) {
        if (entity.getClaimChgHistId() == null) throw new CmBizException("claimChgHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getClaimChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getClaimChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhClaimChgHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdhClaimChgHist entity = findById(id);
        odhClaimChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<OdhClaimChgHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getClaimChgHistId() != null)
            .map(OdhClaimChgHist::getClaimChgHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhClaimChgHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdhClaimChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getClaimChgHistId() != null)
            .toList();
        for (OdhClaimChgHist row : updateRows) {
            OdhClaimChgHist entity = findById(row.getClaimChgHistId());
            VoUtil.voCopyExclude(row, entity, "claimChgHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odhClaimChgHistRepository.save(entity);
        }
        em.flush();

        List<OdhClaimChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhClaimChgHist row : insertRows) {
            row.setClaimChgHistId(CmUtil.generateId("odh_claim_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhClaimChgHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
