package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderDiscntRepository;
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
public class OdOrderDiscntService {

    private final OdOrderDiscntRepository odOrderDiscntRepository;

    @PersistenceContext
    private EntityManager em;

    public OdOrderDiscntDto.Item getById(String id) {
        OdOrderDiscntDto.Item dto = odOrderDiscntRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdOrderDiscntDto.Item getByIdOrNull(String id) {
        return odOrderDiscntRepository.selectById(id).orElse(null);
    }

    public OdOrderDiscnt findById(String id) {
        return odOrderDiscntRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdOrderDiscnt findByIdOrNull(String id) {
        return odOrderDiscntRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return odOrderDiscntRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odOrderDiscntRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<OdOrderDiscntDto.Item> getList(OdOrderDiscntDto.Request req) {
        return odOrderDiscntRepository.selectList(req);
    }

    public OdOrderDiscntDto.PageResponse getPageData(OdOrderDiscntDto.Request req) {
        PageHelper.addPaging(req);
        return odOrderDiscntRepository.selectPageList(req);
    }

    @Transactional
    public OdOrderDiscnt create(OdOrderDiscnt body) {
        body.setOrderDiscntId(CmUtil.generateId("od_order_discnt"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdOrderDiscnt saved = odOrderDiscntRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public OdOrderDiscnt save(OdOrderDiscnt entity) {
        if (!existsById(entity.getOrderDiscntId()))
            throw new CmBizException("존재하지 않는 OdOrderDiscnt입니다: " + entity.getOrderDiscntId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrderDiscnt saved = odOrderDiscntRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public OdOrderDiscnt update(String id, OdOrderDiscnt body) {
        OdOrderDiscnt entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "orderDiscntId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrderDiscnt saved = odOrderDiscntRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public OdOrderDiscnt updateSelective(OdOrderDiscnt entity) {
        if (entity.getOrderDiscntId() == null) throw new CmBizException("orderDiscntId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getOrderDiscntId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getOrderDiscntId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odOrderDiscntRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdOrderDiscnt entity = findById(id);
        odOrderDiscntRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<OdOrderDiscnt> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getOrderDiscntId() != null)
            .map(OdOrderDiscnt::getOrderDiscntId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odOrderDiscntRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdOrderDiscnt> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getOrderDiscntId() != null)
            .toList();
        for (OdOrderDiscnt row : updateRows) {
            OdOrderDiscnt entity = findById(row.getOrderDiscntId());
            VoUtil.voCopyExclude(row, entity, "orderDiscntId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odOrderDiscntRepository.save(entity);
        }
        em.flush();

        List<OdOrderDiscnt> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdOrderDiscnt row : insertRows) {
            row.setOrderDiscntId(CmUtil.generateId("od_order_discnt"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odOrderDiscntRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
