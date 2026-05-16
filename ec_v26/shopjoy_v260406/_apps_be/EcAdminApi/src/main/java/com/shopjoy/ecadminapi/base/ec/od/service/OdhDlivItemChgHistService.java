package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhDlivItemChgHistRepository;
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
public class OdhDlivItemChgHistService {

    private final OdhDlivItemChgHistRepository odhDlivItemChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 배송 아이템 변경 이력 키조회 */
    public OdhDlivItemChgHistDto.Item getById(String id) {
        OdhDlivItemChgHistDto.Item dto = odhDlivItemChgHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhDlivItemChgHistDto.Item getByIdOrNull(String id) {
        return odhDlivItemChgHistRepository.selectById(id).orElse(null);
    }

    /* 배송 아이템 변경 이력 상세조회 */
    public OdhDlivItemChgHist findById(String id) {
        return odhDlivItemChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhDlivItemChgHist findByIdOrNull(String id) {
        return odhDlivItemChgHistRepository.findById(id).orElse(null);
    }

    /* 배송 아이템 변경 이력 키검증 */
    public boolean existsById(String id) {
        return odhDlivItemChgHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odhDlivItemChgHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 배송 아이템 변경 이력 목록조회 */
    public List<OdhDlivItemChgHistDto.Item> getList(OdhDlivItemChgHistDto.Request req) {
        return odhDlivItemChgHistRepository.selectList(req);
    }

    /* 배송 아이템 변경 이력 페이지조회 */
    public OdhDlivItemChgHistDto.PageResponse getPageData(OdhDlivItemChgHistDto.Request req) {
        PageHelper.addPaging(req);
        return odhDlivItemChgHistRepository.selectPageList(req);
    }

    /* 배송 아이템 변경 이력 등록 */
    @Transactional
    public OdhDlivItemChgHist create(OdhDlivItemChgHist body) {
        body.setDlivItemChgHistId(CmUtil.generateId("odh_dliv_item_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhDlivItemChgHist saved = odhDlivItemChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 배송 아이템 변경 이력 저장 */
    @Transactional
    public OdhDlivItemChgHist save(OdhDlivItemChgHist entity) {
        if (!existsById(entity.getDlivItemChgHistId()))
            throw new CmBizException("존재하지 않는 OdhDlivItemChgHist입니다: " + entity.getDlivItemChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhDlivItemChgHist saved = odhDlivItemChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 배송 아이템 변경 이력 수정 */
    @Transactional
    public OdhDlivItemChgHist update(String id, OdhDlivItemChgHist body) {
        OdhDlivItemChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "dlivItemChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhDlivItemChgHist saved = odhDlivItemChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 배송 아이템 변경 이력 수정 */
    @Transactional
    public OdhDlivItemChgHist updateSelective(OdhDlivItemChgHist entity) {
        if (entity.getDlivItemChgHistId() == null) throw new CmBizException("dlivItemChgHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getDlivItemChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDlivItemChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhDlivItemChgHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 배송 아이템 변경 이력 삭제 */
    @Transactional
    public void delete(String id) {
        OdhDlivItemChgHist entity = findById(id);
        odhDlivItemChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 배송 아이템 변경 이력 목록저장 */
    @Transactional
    public void saveList(List<OdhDlivItemChgHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getDlivItemChgHistId() != null)
            .map(OdhDlivItemChgHist::getDlivItemChgHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhDlivItemChgHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdhDlivItemChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getDlivItemChgHistId() != null)
            .toList();
        for (OdhDlivItemChgHist row : updateRows) {
            OdhDlivItemChgHist entity = findById(row.getDlivItemChgHistId());
            VoUtil.voCopyExclude(row, entity, "dlivItemChgHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odhDlivItemChgHistRepository.save(entity);
        }
        em.flush();

        List<OdhDlivItemChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhDlivItemChgHist row : insertRows) {
            row.setDlivItemChgHistId(CmUtil.generateId("odh_dliv_item_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhDlivItemChgHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
