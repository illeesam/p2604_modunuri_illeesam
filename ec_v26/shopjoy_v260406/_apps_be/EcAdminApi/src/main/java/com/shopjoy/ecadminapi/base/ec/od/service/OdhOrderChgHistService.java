package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhOrderChgHistRepository;
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
public class OdhOrderChgHistService {

    private final OdhOrderChgHistRepository odhOrderChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    public OdhOrderChgHistDto.Item getById(String id) {
        OdhOrderChgHistDto.Item dto = odhOrderChgHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhOrderChgHistDto.Item getByIdOrNull(String id) {
        return odhOrderChgHistRepository.selectById(id).orElse(null);
    }

    public OdhOrderChgHist findById(String id) {
        return odhOrderChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhOrderChgHist findByIdOrNull(String id) {
        return odhOrderChgHistRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return odhOrderChgHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odhOrderChgHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<OdhOrderChgHistDto.Item> getList(OdhOrderChgHistDto.Request req) {
        return odhOrderChgHistRepository.selectList(req);
    }

    public OdhOrderChgHistDto.PageResponse getPageData(OdhOrderChgHistDto.Request req) {
        PageHelper.addPaging(req);
        return odhOrderChgHistRepository.selectPageList(req);
    }

    @Transactional
    public OdhOrderChgHist create(OdhOrderChgHist body) {
        body.setOrderChgHistId(CmUtil.generateId("odh_order_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhOrderChgHist saved = odhOrderChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public OdhOrderChgHist save(OdhOrderChgHist entity) {
        if (!existsById(entity.getOrderChgHistId()))
            throw new CmBizException("존재하지 않는 OdhOrderChgHist입니다: " + entity.getOrderChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhOrderChgHist saved = odhOrderChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public OdhOrderChgHist update(String id, OdhOrderChgHist body) {
        OdhOrderChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "orderChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhOrderChgHist saved = odhOrderChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public OdhOrderChgHist updateSelective(OdhOrderChgHist entity) {
        if (entity.getOrderChgHistId() == null) throw new CmBizException("orderChgHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getOrderChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getOrderChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhOrderChgHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdhOrderChgHist entity = findById(id);
        odhOrderChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<OdhOrderChgHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getOrderChgHistId() != null)
            .map(OdhOrderChgHist::getOrderChgHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhOrderChgHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdhOrderChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getOrderChgHistId() != null)
            .toList();
        for (OdhOrderChgHist row : updateRows) {
            OdhOrderChgHist entity = findById(row.getOrderChgHistId());
            VoUtil.voCopyExclude(row, entity, "orderChgHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odhOrderChgHistRepository.save(entity);
        }
        em.flush();

        List<OdhOrderChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhOrderChgHist row : insertRows) {
            row.setOrderChgHistId(CmUtil.generateId("odh_order_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhOrderChgHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
