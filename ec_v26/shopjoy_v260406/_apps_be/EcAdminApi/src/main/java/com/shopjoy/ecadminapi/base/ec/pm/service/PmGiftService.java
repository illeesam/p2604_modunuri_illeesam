package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmGiftRepository;
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
public class PmGiftService {

    private final PmGiftRepository pmGiftRepository;

    @PersistenceContext
    private EntityManager em;

    public PmGiftDto.Item getById(String id) {
        PmGiftDto.Item dto = pmGiftRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmGiftDto.Item getByIdOrNull(String id) {
        return pmGiftRepository.selectById(id).orElse(null);
    }

    public PmGift findById(String id) {
        return pmGiftRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmGift findByIdOrNull(String id) {
        return pmGiftRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pmGiftRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmGiftRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PmGiftDto.Item> getList(PmGiftDto.Request req) {
        return pmGiftRepository.selectList(req);
    }

    public PmGiftDto.PageResponse getPageData(PmGiftDto.Request req) {
        PageHelper.addPaging(req);
        return pmGiftRepository.selectPageList(req);
    }

    @Transactional
    public PmGift create(PmGift body) {
        body.setGiftId(CmUtil.generateId("pm_gift"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmGift saved = pmGiftRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmGift save(PmGift entity) {
        if (!existsById(entity.getGiftId()))
            throw new CmBizException("존재하지 않는 PmGift입니다: " + entity.getGiftId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmGift saved = pmGiftRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmGift update(String id, PmGift body) {
        PmGift entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "giftId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmGift saved = pmGiftRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmGift updateSelective(PmGift entity) {
        if (entity.getGiftId() == null) throw new CmBizException("giftId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getGiftId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getGiftId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmGiftRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PmGift entity = findById(id);
        pmGiftRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PmGift> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getGiftId() != null)
            .map(PmGift::getGiftId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmGiftRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmGift> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getGiftId() != null)
            .toList();
        for (PmGift row : updateRows) {
            PmGift entity = findById(row.getGiftId());
            VoUtil.voCopyExclude(row, entity, "giftId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmGiftRepository.save(entity);
        }
        em.flush();

        List<PmGift> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmGift row : insertRows) {
            row.setGiftId(CmUtil.generateId("pm_gift"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmGiftRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
