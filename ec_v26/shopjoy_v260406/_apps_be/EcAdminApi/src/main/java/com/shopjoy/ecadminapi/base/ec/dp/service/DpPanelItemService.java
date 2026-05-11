package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelItemDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanelItem;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpPanelItemMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpPanelItemRepository;
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
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DpPanelItemService {

    private final DpPanelItemMapper dpPanelItemMapper;
    private final DpPanelItemRepository dpPanelItemRepository;

    @PersistenceContext
    private EntityManager em;

    public DpPanelItemDto.Item getById(String id) {
        DpPanelItemDto.Item dto = dpPanelItemMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public DpPanelItem findById(String id) {
        return dpPanelItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return dpPanelItemRepository.existsById(id);
    }

    public List<DpPanelItemDto.Item> getList(DpPanelItemDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return dpPanelItemMapper.selectList(VoUtil.voToMap(req));
    }

    public DpPanelItemDto.PageResponse getPageData(DpPanelItemDto.Request req) {
        PageHelper.addPaging(req);
        DpPanelItemDto.PageResponse res = new DpPanelItemDto.PageResponse();
        List<DpPanelItemDto.Item> list = dpPanelItemMapper.selectPageList(VoUtil.voToMap(req));
        long count = dpPanelItemMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public DpPanelItem create(DpPanelItem body) {
        body.setPanelItemId(CmUtil.generateId("dp_panel_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        DpPanelItem saved = dpPanelItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public DpPanelItem save(DpPanelItem entity) {
        if (!existsById(entity.getPanelItemId()))
            throw new CmBizException("존재하지 않는 DpPanelItem입니다: " + entity.getPanelItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpPanelItem saved = dpPanelItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public DpPanelItem update(String id, DpPanelItem body) {
        DpPanelItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "panelItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpPanelItem saved = dpPanelItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public DpPanelItem updateSelective(DpPanelItem entity) {
        if (entity.getPanelItemId() == null) throw new CmBizException("panelItemId 가 필요합니다.");
        if (!existsById(entity.getPanelItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPanelItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = dpPanelItemMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        DpPanelItem entity = findById(id);
        dpPanelItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<DpPanelItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getPanelItemId() != null)
            .map(DpPanelItem::getPanelItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            dpPanelItemRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<DpPanelItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getPanelItemId() != null)
            .toList();
        for (DpPanelItem row : updateRows) {
            DpPanelItem entity = findById(row.getPanelItemId());
            VoUtil.voCopyExclude(row, entity, "panelItemId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            dpPanelItemRepository.save(entity);
        }
        em.flush();

        List<DpPanelItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (DpPanelItem row : insertRows) {
            row.setPanelItemId(CmUtil.generateId("dp_panel_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            dpPanelItemRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
