package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmDiscntItemRepository;
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
public class PmDiscntItemService {

    private final PmDiscntItemRepository pmDiscntItemRepository;

    @PersistenceContext
    private EntityManager em;

    public PmDiscntItemDto.Item getById(String id) {
        PmDiscntItemDto.Item dto = pmDiscntItemRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmDiscntItemDto.Item getByIdOrNull(String id) {
        return pmDiscntItemRepository.selectById(id).orElse(null);
    }

    public PmDiscntItem findById(String id) {
        return pmDiscntItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmDiscntItem findByIdOrNull(String id) {
        return pmDiscntItemRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pmDiscntItemRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmDiscntItemRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PmDiscntItemDto.Item> getList(PmDiscntItemDto.Request req) {
        return pmDiscntItemRepository.selectList(req);
    }

    public PmDiscntItemDto.PageResponse getPageData(PmDiscntItemDto.Request req) {
        PageHelper.addPaging(req);
        return pmDiscntItemRepository.selectPageList(req);
    }

    @Transactional
    public PmDiscntItem create(PmDiscntItem body) {
        body.setDiscntItemId(CmUtil.generateId("pm_discnt_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmDiscntItem saved = pmDiscntItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmDiscntItem save(PmDiscntItem entity) {
        if (!existsById(entity.getDiscntItemId()))
            throw new CmBizException("존재하지 않는 PmDiscntItem입니다: " + entity.getDiscntItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmDiscntItem saved = pmDiscntItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmDiscntItem update(String id, PmDiscntItem body) {
        PmDiscntItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "discntItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmDiscntItem saved = pmDiscntItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmDiscntItem updateSelective(PmDiscntItem entity) {
        if (entity.getDiscntItemId() == null) throw new CmBizException("discntItemId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getDiscntItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDiscntItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmDiscntItemRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PmDiscntItem entity = findById(id);
        pmDiscntItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PmDiscntItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getDiscntItemId() != null)
            .map(PmDiscntItem::getDiscntItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmDiscntItemRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmDiscntItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getDiscntItemId() != null)
            .toList();
        for (PmDiscntItem row : updateRows) {
            PmDiscntItem entity = findById(row.getDiscntItemId());
            VoUtil.voCopyExclude(row, entity, "discntItemId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmDiscntItemRepository.save(entity);
        }
        em.flush();

        List<PmDiscntItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmDiscntItem row : insertRows) {
            row.setDiscntItemId(CmUtil.generateId("pm_discnt_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmDiscntItemRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
