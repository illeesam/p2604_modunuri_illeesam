package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpAreaPanel;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpAreaPanelMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpAreaPanelRepository;
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
public class DpAreaPanelService {

    private final DpAreaPanelMapper dpAreaPanelMapper;
    private final DpAreaPanelRepository dpAreaPanelRepository;

    @PersistenceContext
    private EntityManager em;

    public DpAreaPanelDto.Item getById(String id) {
        DpAreaPanelDto.Item dto = dpAreaPanelMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public DpAreaPanel findById(String id) {
        return dpAreaPanelRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return dpAreaPanelRepository.existsById(id);
    }

    public List<DpAreaPanelDto.Item> getList(DpAreaPanelDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return dpAreaPanelMapper.selectList(req);
    }

    public DpAreaPanelDto.PageResponse getPageData(DpAreaPanelDto.Request req) {
        PageHelper.addPaging(req);
        DpAreaPanelDto.PageResponse res = new DpAreaPanelDto.PageResponse();
        List<DpAreaPanelDto.Item> list = dpAreaPanelMapper.selectPageList(req);
        long count = dpAreaPanelMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public DpAreaPanel create(DpAreaPanel body) {
        body.setAreaPanelId(CmUtil.generateId("dp_area_panel"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        DpAreaPanel saved = dpAreaPanelRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getAreaPanelId());
    }

    @Transactional
    public DpAreaPanel save(DpAreaPanel entity) {
        if (!existsById(entity.getAreaPanelId()))
            throw new CmBizException("존재하지 않는 DpAreaPanel입니다: " + entity.getAreaPanelId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpAreaPanel saved = dpAreaPanelRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getAreaPanelId());
    }

    @Transactional
    public DpAreaPanel update(String id, DpAreaPanel body) {
        DpAreaPanel entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "areaPanelId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpAreaPanel saved = dpAreaPanelRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public DpAreaPanel updatePartial(DpAreaPanel entity) {
        if (entity.getAreaPanelId() == null) throw new CmBizException("areaPanelId 가 필요합니다.");
        if (!existsById(entity.getAreaPanelId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getAreaPanelId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = dpAreaPanelMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getAreaPanelId());
    }

    @Transactional
    public void delete(String id) {
        DpAreaPanel entity = findById(id);
        dpAreaPanelRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<DpAreaPanel> saveList(List<DpAreaPanel> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getAreaPanelId() != null)
            .map(DpAreaPanel::getAreaPanelId)
            .toList();
        if (!deleteIds.isEmpty()) {
            dpAreaPanelRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<DpAreaPanel> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getAreaPanelId() != null)
            .toList();
        for (DpAreaPanel row : updateRows) {
            DpAreaPanel entity = findById(row.getAreaPanelId());
            VoUtil.voCopyExclude(row, entity, "areaPanelId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            dpAreaPanelRepository.save(entity);
            upsertedIds.add(entity.getAreaPanelId());
        }
        em.flush();

        List<DpAreaPanel> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (DpAreaPanel row : insertRows) {
            row.setAreaPanelId(CmUtil.generateId("dp_area_panel"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            dpAreaPanelRepository.save(row);
            upsertedIds.add(row.getAreaPanelId());
        }
        em.flush();
        em.clear();

        List<DpAreaPanel> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
