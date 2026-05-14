package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhOrderItemChgHistRepository;
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
public class OdhOrderItemChgHistService {

    private final OdhOrderItemChgHistRepository odhOrderItemChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    public OdhOrderItemChgHistDto.Item getById(String id) {
        OdhOrderItemChgHistDto.Item dto = odhOrderItemChgHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhOrderItemChgHistDto.Item getByIdOrNull(String id) {
        return odhOrderItemChgHistRepository.selectById(id).orElse(null);
    }

    public OdhOrderItemChgHist findById(String id) {
        return odhOrderItemChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhOrderItemChgHist findByIdOrNull(String id) {
        return odhOrderItemChgHistRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return odhOrderItemChgHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odhOrderItemChgHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<OdhOrderItemChgHistDto.Item> getList(OdhOrderItemChgHistDto.Request req) {
        return odhOrderItemChgHistRepository.selectList(req);
    }

    public OdhOrderItemChgHistDto.PageResponse getPageData(OdhOrderItemChgHistDto.Request req) {
        PageHelper.addPaging(req);
        return odhOrderItemChgHistRepository.selectPageList(req);
    }

    @Transactional
    public OdhOrderItemChgHist create(OdhOrderItemChgHist body) {
        body.setOrderItemChgHistId(CmUtil.generateId("odh_order_item_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhOrderItemChgHist saved = odhOrderItemChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public OdhOrderItemChgHist save(OdhOrderItemChgHist entity) {
        if (!existsById(entity.getOrderItemChgHistId()))
            throw new CmBizException("존재하지 않는 OdhOrderItemChgHist입니다: " + entity.getOrderItemChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhOrderItemChgHist saved = odhOrderItemChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public OdhOrderItemChgHist update(String id, OdhOrderItemChgHist body) {
        OdhOrderItemChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "orderItemChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhOrderItemChgHist saved = odhOrderItemChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public OdhOrderItemChgHist updateSelective(OdhOrderItemChgHist entity) {
        if (entity.getOrderItemChgHistId() == null) throw new CmBizException("orderItemChgHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getOrderItemChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getOrderItemChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhOrderItemChgHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdhOrderItemChgHist entity = findById(id);
        odhOrderItemChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<OdhOrderItemChgHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getOrderItemChgHistId() != null)
            .map(OdhOrderItemChgHist::getOrderItemChgHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhOrderItemChgHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdhOrderItemChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getOrderItemChgHistId() != null)
            .toList();
        for (OdhOrderItemChgHist row : updateRows) {
            OdhOrderItemChgHist entity = findById(row.getOrderItemChgHistId());
            VoUtil.voCopyExclude(row, entity, "orderItemChgHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odhOrderItemChgHistRepository.save(entity);
        }
        em.flush();

        List<OdhOrderItemChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhOrderItemChgHist row : insertRows) {
            row.setOrderItemChgHistId(CmUtil.generateId("odh_order_item_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhOrderItemChgHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
