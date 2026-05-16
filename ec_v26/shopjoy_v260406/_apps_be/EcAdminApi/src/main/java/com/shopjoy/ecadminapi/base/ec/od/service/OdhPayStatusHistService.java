package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhPayStatusHistRepository;
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
public class OdhPayStatusHistService {

    private final OdhPayStatusHistRepository odhPayStatusHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 결제 상태 이력 키조회 */
    public OdhPayStatusHistDto.Item getById(String id) {
        OdhPayStatusHistDto.Item dto = odhPayStatusHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhPayStatusHistDto.Item getByIdOrNull(String id) {
        return odhPayStatusHistRepository.selectById(id).orElse(null);
    }

    /* 결제 상태 이력 상세조회 */
    public OdhPayStatusHist findById(String id) {
        return odhPayStatusHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhPayStatusHist findByIdOrNull(String id) {
        return odhPayStatusHistRepository.findById(id).orElse(null);
    }

    /* 결제 상태 이력 키검증 */
    public boolean existsById(String id) {
        return odhPayStatusHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odhPayStatusHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 결제 상태 이력 목록조회 */
    public List<OdhPayStatusHistDto.Item> getList(OdhPayStatusHistDto.Request req) {
        return odhPayStatusHistRepository.selectList(req);
    }

    /* 결제 상태 이력 페이지조회 */
    public OdhPayStatusHistDto.PageResponse getPageData(OdhPayStatusHistDto.Request req) {
        PageHelper.addPaging(req);
        return odhPayStatusHistRepository.selectPageList(req);
    }

    /* 결제 상태 이력 등록 */
    @Transactional
    public OdhPayStatusHist create(OdhPayStatusHist body) {
        body.setPayStatusHistId(CmUtil.generateId("odh_pay_status_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhPayStatusHist saved = odhPayStatusHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 결제 상태 이력 저장 */
    @Transactional
    public OdhPayStatusHist save(OdhPayStatusHist entity) {
        if (!existsById(entity.getPayStatusHistId()))
            throw new CmBizException("존재하지 않는 OdhPayStatusHist입니다: " + entity.getPayStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhPayStatusHist saved = odhPayStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 결제 상태 이력 수정 */
    @Transactional
    public OdhPayStatusHist update(String id, OdhPayStatusHist body) {
        OdhPayStatusHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "payStatusHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhPayStatusHist saved = odhPayStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 결제 상태 이력 수정 */
    @Transactional
    public OdhPayStatusHist updateSelective(OdhPayStatusHist entity) {
        if (entity.getPayStatusHistId() == null) throw new CmBizException("payStatusHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getPayStatusHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPayStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhPayStatusHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 결제 상태 이력 삭제 */
    @Transactional
    public void delete(String id) {
        OdhPayStatusHist entity = findById(id);
        odhPayStatusHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 결제 상태 이력 목록저장 */
    @Transactional
    public void saveList(List<OdhPayStatusHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getPayStatusHistId() != null)
            .map(OdhPayStatusHist::getPayStatusHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhPayStatusHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdhPayStatusHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getPayStatusHistId() != null)
            .toList();
        for (OdhPayStatusHist row : updateRows) {
            OdhPayStatusHist entity = findById(row.getPayStatusHistId());
            VoUtil.voCopyExclude(row, entity, "payStatusHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odhPayStatusHistRepository.save(entity);
        }
        em.flush();

        List<OdhPayStatusHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhPayStatusHist row : insertRows) {
            row.setPayStatusHistId(CmUtil.generateId("odh_pay_status_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhPayStatusHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
