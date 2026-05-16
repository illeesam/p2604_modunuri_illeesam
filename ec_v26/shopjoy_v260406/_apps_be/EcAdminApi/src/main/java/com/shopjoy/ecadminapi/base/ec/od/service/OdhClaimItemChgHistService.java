package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhClaimItemChgHistRepository;
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
public class OdhClaimItemChgHistService {

    private final OdhClaimItemChgHistRepository odhClaimItemChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 클레임 아이템 변경 이력 키조회 */
    public OdhClaimItemChgHistDto.Item getById(String id) {
        OdhClaimItemChgHistDto.Item dto = odhClaimItemChgHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhClaimItemChgHistDto.Item getByIdOrNull(String id) {
        return odhClaimItemChgHistRepository.selectById(id).orElse(null);
    }

    /* 클레임 아이템 변경 이력 상세조회 */
    public OdhClaimItemChgHist findById(String id) {
        return odhClaimItemChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhClaimItemChgHist findByIdOrNull(String id) {
        return odhClaimItemChgHistRepository.findById(id).orElse(null);
    }

    /* 클레임 아이템 변경 이력 키검증 */
    public boolean existsById(String id) {
        return odhClaimItemChgHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odhClaimItemChgHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 클레임 아이템 변경 이력 목록조회 */
    public List<OdhClaimItemChgHistDto.Item> getList(OdhClaimItemChgHistDto.Request req) {
        return odhClaimItemChgHistRepository.selectList(req);
    }

    /* 클레임 아이템 변경 이력 페이지조회 */
    public OdhClaimItemChgHistDto.PageResponse getPageData(OdhClaimItemChgHistDto.Request req) {
        PageHelper.addPaging(req);
        return odhClaimItemChgHistRepository.selectPageList(req);
    }

    /* 클레임 아이템 변경 이력 등록 */
    @Transactional
    public OdhClaimItemChgHist create(OdhClaimItemChgHist body) {
        body.setClaimItemChgHistId(CmUtil.generateId("odh_claim_item_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhClaimItemChgHist saved = odhClaimItemChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 클레임 아이템 변경 이력 저장 */
    @Transactional
    public OdhClaimItemChgHist save(OdhClaimItemChgHist entity) {
        if (!existsById(entity.getClaimItemChgHistId()))
            throw new CmBizException("존재하지 않는 OdhClaimItemChgHist입니다: " + entity.getClaimItemChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhClaimItemChgHist saved = odhClaimItemChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 클레임 아이템 변경 이력 수정 */
    @Transactional
    public OdhClaimItemChgHist update(String id, OdhClaimItemChgHist body) {
        OdhClaimItemChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "claimItemChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhClaimItemChgHist saved = odhClaimItemChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 클레임 아이템 변경 이력 수정 */
    @Transactional
    public OdhClaimItemChgHist updateSelective(OdhClaimItemChgHist entity) {
        if (entity.getClaimItemChgHistId() == null) throw new CmBizException("claimItemChgHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getClaimItemChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getClaimItemChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhClaimItemChgHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 클레임 아이템 변경 이력 삭제 */
    @Transactional
    public void delete(String id) {
        OdhClaimItemChgHist entity = findById(id);
        odhClaimItemChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 클레임 아이템 변경 이력 목록저장 */
    @Transactional
    public void saveList(List<OdhClaimItemChgHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getClaimItemChgHistId() != null)
            .map(OdhClaimItemChgHist::getClaimItemChgHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhClaimItemChgHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdhClaimItemChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getClaimItemChgHistId() != null)
            .toList();
        for (OdhClaimItemChgHist row : updateRows) {
            OdhClaimItemChgHist entity = findById(row.getClaimItemChgHistId());
            VoUtil.voCopyExclude(row, entity, "claimItemChgHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odhClaimItemChgHistRepository.save(entity);
        }
        em.flush();

        List<OdhClaimItemChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhClaimItemChgHist row : insertRows) {
            row.setClaimItemChgHistId(CmUtil.generateId("odh_claim_item_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhClaimItemChgHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
