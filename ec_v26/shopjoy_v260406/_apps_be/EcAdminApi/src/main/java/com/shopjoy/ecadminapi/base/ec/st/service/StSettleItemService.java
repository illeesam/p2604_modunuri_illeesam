package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleItemDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleItem;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleItemRepository;
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
public class StSettleItemService {

    private final StSettleItemRepository stSettleItemRepository;

    @PersistenceContext
    private EntityManager em;

    public StSettleItemDto.Item getById(String id) {
        StSettleItemDto.Item dto = stSettleItemRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleItemDto.Item getByIdOrNull(String id) {
        return stSettleItemRepository.selectById(id).orElse(null);
    }

    public StSettleItem findById(String id) {
        return stSettleItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public StSettleItem findByIdOrNull(String id) {
        return stSettleItemRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return stSettleItemRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!stSettleItemRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<StSettleItemDto.Item> getList(StSettleItemDto.Request req) {
        return stSettleItemRepository.selectList(req);
    }

    public StSettleItemDto.PageResponse getPageData(StSettleItemDto.Request req) {
        PageHelper.addPaging(req);
        return stSettleItemRepository.selectPageList(req);
    }

    @Transactional
    public StSettleItem create(StSettleItem body) {
        body.setSettleItemId(CmUtil.generateId("st_settle_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StSettleItem saved = stSettleItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public StSettleItem save(StSettleItem entity) {
        if (!existsById(entity.getSettleItemId()))
            throw new CmBizException("존재하지 않는 StSettleItem입니다: " + entity.getSettleItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleItem saved = stSettleItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public StSettleItem update(String id, StSettleItem body) {
        StSettleItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "settleItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleItem saved = stSettleItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public StSettleItem updateSelective(StSettleItem entity) {
        if (entity.getSettleItemId() == null) throw new CmBizException("settleItemId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSettleItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSettleItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = stSettleItemRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        StSettleItem entity = findById(id);
        stSettleItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<StSettleItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSettleItemId() != null)
            .map(StSettleItem::getSettleItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            stSettleItemRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<StSettleItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSettleItemId() != null)
            .toList();
        for (StSettleItem row : updateRows) {
            StSettleItem entity = findById(row.getSettleItemId());
            VoUtil.voCopyExclude(row, entity, "settleItemId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            stSettleItemRepository.save(entity);
        }
        em.flush();

        List<StSettleItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StSettleItem row : insertRows) {
            row.setSettleItemId(CmUtil.generateId("st_settle_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            stSettleItemRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
