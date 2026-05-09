package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpPanelMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpPanelRepository;
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
public class DpPanelService {

    private final DpPanelMapper dpPanelMapper;
    private final DpPanelRepository dpPanelRepository;

    @PersistenceContext
    private EntityManager em;

    public DpPanelDto.Item getById(String id) {
        DpPanelDto.Item dto = dpPanelMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public DpPanel findById(String id) {
        return dpPanelRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return dpPanelRepository.existsById(id);
    }

    public List<DpPanelDto.Item> getList(DpPanelDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return dpPanelMapper.selectList(req);
    }

    public DpPanelDto.PageResponse getPageData(DpPanelDto.Request req) {
        PageHelper.addPaging(req);
        DpPanelDto.PageResponse res = new DpPanelDto.PageResponse();
        List<DpPanelDto.Item> list = dpPanelMapper.selectPageList(req);
        long count = dpPanelMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public DpPanel create(DpPanel body) {
        body.setPanelId(CmUtil.generateId("dp_panel"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        DpPanel saved = dpPanelRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getPanelId());
    }

    @Transactional
    public DpPanel save(DpPanel entity) {
        if (!existsById(entity.getPanelId()))
            throw new CmBizException("존재하지 않는 DpPanel입니다: " + entity.getPanelId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpPanel saved = dpPanelRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getPanelId());
    }

    @Transactional
    public DpPanel update(String id, DpPanel body) {
        DpPanel entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "panelId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpPanel saved = dpPanelRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public DpPanel updatePartial(DpPanel entity) {
        if (entity.getPanelId() == null) throw new CmBizException("panelId 가 필요합니다.");
        if (!existsById(entity.getPanelId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPanelId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = dpPanelMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getPanelId());
    }

    @Transactional
    public void delete(String id) {
        DpPanel entity = findById(id);
        dpPanelRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<DpPanel> saveList(List<DpPanel> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getPanelId() != null)
            .map(DpPanel::getPanelId)
            .toList();
        if (!deleteIds.isEmpty()) {
            dpPanelRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<DpPanel> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getPanelId() != null)
            .toList();
        for (DpPanel row : updateRows) {
            DpPanel entity = findById(row.getPanelId());
            VoUtil.voCopyExclude(row, entity, "panelId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            dpPanelRepository.save(entity);
            upsertedIds.add(entity.getPanelId());
        }
        em.flush();

        List<DpPanel> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (DpPanel row : insertRows) {
            row.setPanelId(CmUtil.generateId("dp_panel"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            dpPanelRepository.save(row);
            upsertedIds.add(row.getPanelId());
        }
        em.flush();
        em.clear();

        List<DpPanel> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
