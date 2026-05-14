package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhOrderStatusHistRepository;
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
public class OdhOrderStatusHistService {

    private final OdhOrderStatusHistRepository odhOrderStatusHistRepository;

    @PersistenceContext
    private EntityManager em;

    public OdhOrderStatusHistDto.Item getById(String id) {
        OdhOrderStatusHistDto.Item dto = odhOrderStatusHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhOrderStatusHistDto.Item getByIdOrNull(String id) {
        return odhOrderStatusHistRepository.selectById(id).orElse(null);
    }

    public OdhOrderStatusHist findById(String id) {
        return odhOrderStatusHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhOrderStatusHist findByIdOrNull(String id) {
        return odhOrderStatusHistRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return odhOrderStatusHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odhOrderStatusHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<OdhOrderStatusHistDto.Item> getList(OdhOrderStatusHistDto.Request req) {
        return odhOrderStatusHistRepository.selectList(req);
    }

    public OdhOrderStatusHistDto.PageResponse getPageData(OdhOrderStatusHistDto.Request req) {
        PageHelper.addPaging(req);
        return odhOrderStatusHistRepository.selectPageList(req);
    }

    @Transactional
    public OdhOrderStatusHist create(OdhOrderStatusHist body) {
        body.setOrderStatusHistId(CmUtil.generateId("odh_order_status_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhOrderStatusHist saved = odhOrderStatusHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public OdhOrderStatusHist save(OdhOrderStatusHist entity) {
        if (!existsById(entity.getOrderStatusHistId()))
            throw new CmBizException("존재하지 않는 OdhOrderStatusHist입니다: " + entity.getOrderStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhOrderStatusHist saved = odhOrderStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public OdhOrderStatusHist update(String id, OdhOrderStatusHist body) {
        OdhOrderStatusHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "orderStatusHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhOrderStatusHist saved = odhOrderStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public OdhOrderStatusHist updateSelective(OdhOrderStatusHist entity) {
        if (entity.getOrderStatusHistId() == null) throw new CmBizException("orderStatusHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getOrderStatusHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getOrderStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhOrderStatusHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdhOrderStatusHist entity = findById(id);
        odhOrderStatusHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<OdhOrderStatusHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getOrderStatusHistId() != null)
            .map(OdhOrderStatusHist::getOrderStatusHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhOrderStatusHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdhOrderStatusHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getOrderStatusHistId() != null)
            .toList();
        for (OdhOrderStatusHist row : updateRows) {
            OdhOrderStatusHist entity = findById(row.getOrderStatusHistId());
            VoUtil.voCopyExclude(row, entity, "orderStatusHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odhOrderStatusHistRepository.save(entity);
        }
        em.flush();

        List<OdhOrderStatusHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhOrderStatusHist row : insertRows) {
            row.setOrderStatusHistId(CmUtil.generateId("odh_order_status_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhOrderStatusHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
