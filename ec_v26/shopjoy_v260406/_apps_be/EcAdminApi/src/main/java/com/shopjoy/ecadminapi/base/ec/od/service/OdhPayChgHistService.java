package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhPayChgHistRepository;
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
public class OdhPayChgHistService {

    private final OdhPayChgHistRepository odhPayChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 결제 변경 이력 키조회 */
    public OdhPayChgHistDto.Item getById(String id) {
        OdhPayChgHistDto.Item dto = odhPayChgHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhPayChgHistDto.Item getByIdOrNull(String id) {
        return odhPayChgHistRepository.selectById(id).orElse(null);
    }

    /* 결제 변경 이력 상세조회 */
    public OdhPayChgHist findById(String id) {
        return odhPayChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhPayChgHist findByIdOrNull(String id) {
        return odhPayChgHistRepository.findById(id).orElse(null);
    }

    /* 결제 변경 이력 키검증 */
    public boolean existsById(String id) {
        return odhPayChgHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odhPayChgHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 결제 변경 이력 목록조회 */
    public List<OdhPayChgHistDto.Item> getList(OdhPayChgHistDto.Request req) {
        return odhPayChgHistRepository.selectList(req);
    }

    /* 결제 변경 이력 페이지조회 */
    public OdhPayChgHistDto.PageResponse getPageData(OdhPayChgHistDto.Request req) {
        PageHelper.addPaging(req);
        return odhPayChgHistRepository.selectPageList(req);
    }

    /* 결제 변경 이력 등록 */
    @Transactional
    public OdhPayChgHist create(OdhPayChgHist body) {
        body.setPayChgHistId(CmUtil.generateId("odh_pay_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhPayChgHist saved = odhPayChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 결제 변경 이력 저장 */
    @Transactional
    public OdhPayChgHist save(OdhPayChgHist entity) {
        if (!existsById(entity.getPayChgHistId()))
            throw new CmBizException("존재하지 않는 OdhPayChgHist입니다: " + entity.getPayChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhPayChgHist saved = odhPayChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 결제 변경 이력 수정 */
    @Transactional
    public OdhPayChgHist update(String id, OdhPayChgHist body) {
        OdhPayChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "payChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhPayChgHist saved = odhPayChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 결제 변경 이력 수정 */
    @Transactional
    public OdhPayChgHist updateSelective(OdhPayChgHist entity) {
        if (entity.getPayChgHistId() == null) throw new CmBizException("payChgHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getPayChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPayChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhPayChgHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 결제 변경 이력 삭제 */
    @Transactional
    public void delete(String id) {
        OdhPayChgHist entity = findById(id);
        odhPayChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 결제 변경 이력 목록저장 */
    @Transactional
    public void saveList(List<OdhPayChgHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getPayChgHistId() != null)
            .map(OdhPayChgHist::getPayChgHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhPayChgHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdhPayChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getPayChgHistId() != null)
            .toList();
        for (OdhPayChgHist row : updateRows) {
            OdhPayChgHist entity = findById(row.getPayChgHistId());
            VoUtil.voCopyExclude(row, entity, "payChgHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odhPayChgHistRepository.save(entity);
        }
        em.flush();

        List<OdhPayChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhPayChgHist row : insertRows) {
            row.setPayChgHistId(CmUtil.generateId("odh_pay_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhPayChgHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
