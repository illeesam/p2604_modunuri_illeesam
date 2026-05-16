package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhDlivStatusHistRepository;
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
public class OdhDlivStatusHistService {

    private final OdhDlivStatusHistRepository odhDlivStatusHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 배송 상태 이력 키조회 */
    public OdhDlivStatusHistDto.Item getById(String id) {
        OdhDlivStatusHistDto.Item dto = odhDlivStatusHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhDlivStatusHistDto.Item getByIdOrNull(String id) {
        return odhDlivStatusHistRepository.selectById(id).orElse(null);
    }

    /* 배송 상태 이력 상세조회 */
    public OdhDlivStatusHist findById(String id) {
        return odhDlivStatusHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhDlivStatusHist findByIdOrNull(String id) {
        return odhDlivStatusHistRepository.findById(id).orElse(null);
    }

    /* 배송 상태 이력 키검증 */
    public boolean existsById(String id) {
        return odhDlivStatusHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odhDlivStatusHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 배송 상태 이력 목록조회 */
    public List<OdhDlivStatusHistDto.Item> getList(OdhDlivStatusHistDto.Request req) {
        return odhDlivStatusHistRepository.selectList(req);
    }

    /* 배송 상태 이력 페이지조회 */
    public OdhDlivStatusHistDto.PageResponse getPageData(OdhDlivStatusHistDto.Request req) {
        PageHelper.addPaging(req);
        return odhDlivStatusHistRepository.selectPageList(req);
    }

    /* 배송 상태 이력 등록 */
    @Transactional
    public OdhDlivStatusHist create(OdhDlivStatusHist body) {
        body.setDlivStatusHistId(CmUtil.generateId("odh_dliv_status_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhDlivStatusHist saved = odhDlivStatusHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 배송 상태 이력 저장 */
    @Transactional
    public OdhDlivStatusHist save(OdhDlivStatusHist entity) {
        if (!existsById(entity.getDlivStatusHistId()))
            throw new CmBizException("존재하지 않는 OdhDlivStatusHist입니다: " + entity.getDlivStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhDlivStatusHist saved = odhDlivStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 배송 상태 이력 수정 */
    @Transactional
    public OdhDlivStatusHist update(String id, OdhDlivStatusHist body) {
        OdhDlivStatusHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "dlivStatusHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhDlivStatusHist saved = odhDlivStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 배송 상태 이력 수정 */
    @Transactional
    public OdhDlivStatusHist updateSelective(OdhDlivStatusHist entity) {
        if (entity.getDlivStatusHistId() == null) throw new CmBizException("dlivStatusHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getDlivStatusHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDlivStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhDlivStatusHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 배송 상태 이력 삭제 */
    @Transactional
    public void delete(String id) {
        OdhDlivStatusHist entity = findById(id);
        odhDlivStatusHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 배송 상태 이력 목록저장 */
    @Transactional
    public void saveList(List<OdhDlivStatusHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getDlivStatusHistId() != null)
            .map(OdhDlivStatusHist::getDlivStatusHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhDlivStatusHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdhDlivStatusHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getDlivStatusHistId() != null)
            .toList();
        for (OdhDlivStatusHist row : updateRows) {
            OdhDlivStatusHist entity = findById(row.getDlivStatusHistId());
            VoUtil.voCopyExclude(row, entity, "dlivStatusHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odhDlivStatusHistRepository.save(entity);
        }
        em.flush();

        List<OdhDlivStatusHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhDlivStatusHist row : insertRows) {
            row.setDlivStatusHistId(CmUtil.generateId("odh_dliv_status_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhDlivStatusHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
