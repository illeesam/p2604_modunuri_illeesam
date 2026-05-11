package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpWidgetMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpWidgetRepository;
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
public class DpWidgetService {

    private final DpWidgetMapper dpWidgetMapper;
    private final DpWidgetRepository dpWidgetRepository;

    @PersistenceContext
    private EntityManager em;

    public DpWidgetDto.Item getById(String id) {
        DpWidgetDto.Item dto = dpWidgetMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public DpWidget findById(String id) {
        return dpWidgetRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return dpWidgetRepository.existsById(id);
    }

    public List<DpWidgetDto.Item> getList(DpWidgetDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return dpWidgetMapper.selectList(VoUtil.voToMap(req));
    }

    public DpWidgetDto.PageResponse getPageData(DpWidgetDto.Request req) {
        PageHelper.addPaging(req);
        DpWidgetDto.PageResponse res = new DpWidgetDto.PageResponse();
        List<DpWidgetDto.Item> list = dpWidgetMapper.selectPageList(VoUtil.voToMap(req));
        long count = dpWidgetMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public DpWidget create(DpWidget body) {
        body.setWidgetId(CmUtil.generateId("dp_widget"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        DpWidget saved = dpWidgetRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public DpWidget save(DpWidget entity) {
        if (!existsById(entity.getWidgetId()))
            throw new CmBizException("존재하지 않는 DpWidget입니다: " + entity.getWidgetId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpWidget saved = dpWidgetRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public DpWidget update(String id, DpWidget body) {
        DpWidget entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "widgetId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpWidget saved = dpWidgetRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public DpWidget updateSelective(DpWidget entity) {
        if (entity.getWidgetId() == null) throw new CmBizException("widgetId 가 필요합니다.");
        if (!existsById(entity.getWidgetId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getWidgetId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = dpWidgetMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        DpWidget entity = findById(id);
        dpWidgetRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<DpWidget> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getWidgetId() != null)
            .map(DpWidget::getWidgetId)
            .toList();
        if (!deleteIds.isEmpty()) {
            dpWidgetRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<DpWidget> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getWidgetId() != null)
            .toList();
        for (DpWidget row : updateRows) {
            DpWidget entity = findById(row.getWidgetId());
            VoUtil.voCopyExclude(row, entity, "widgetId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            dpWidgetRepository.save(entity);
        }
        em.flush();

        List<DpWidget> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (DpWidget row : insertRows) {
            row.setWidgetId(CmUtil.generateId("dp_widget"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            dpWidgetRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
