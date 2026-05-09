package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmEventMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmEventRepository;
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
public class PmEventService {

    private final PmEventMapper pmEventMapper;
    private final PmEventRepository pmEventRepository;

    @PersistenceContext
    private EntityManager em;

    public PmEventDto.Item getById(String id) {
        PmEventDto.Item dto = pmEventMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PmEvent findById(String id) {
        return pmEventRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pmEventRepository.existsById(id);
    }

    public List<PmEventDto.Item> getList(PmEventDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pmEventMapper.selectList(req);
    }

    public PmEventDto.PageResponse getPageData(PmEventDto.Request req) {
        PageHelper.addPaging(req);
        PmEventDto.PageResponse res = new PmEventDto.PageResponse();
        List<PmEventDto.Item> list = pmEventMapper.selectPageList(req);
        long count = pmEventMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PmEvent create(PmEvent body) {
        body.setEventId(CmUtil.generateId("pm_event"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmEvent saved = pmEventRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getEventId());
    }

    @Transactional
    public PmEvent save(PmEvent entity) {
        if (!existsById(entity.getEventId()))
            throw new CmBizException("존재하지 않는 PmEvent입니다: " + entity.getEventId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmEvent saved = pmEventRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getEventId());
    }

    @Transactional
    public PmEvent update(String id, PmEvent body) {
        PmEvent entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "eventId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmEvent saved = pmEventRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public PmEvent updatePartial(PmEvent entity) {
        if (entity.getEventId() == null) throw new CmBizException("eventId 가 필요합니다.");
        if (!existsById(entity.getEventId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getEventId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmEventMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getEventId());
    }

    @Transactional
    public void delete(String id) {
        PmEvent entity = findById(id);
        pmEventRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<PmEvent> saveList(List<PmEvent> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getEventId() != null)
            .map(PmEvent::getEventId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmEventRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<PmEvent> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getEventId() != null)
            .toList();
        for (PmEvent row : updateRows) {
            PmEvent entity = findById(row.getEventId());
            VoUtil.voCopyExclude(row, entity, "eventId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmEventRepository.save(entity);
            upsertedIds.add(entity.getEventId());
        }
        em.flush();

        List<PmEvent> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmEvent row : insertRows) {
            row.setEventId(CmUtil.generateId("pm_event"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmEventRepository.save(row);
            upsertedIds.add(row.getEventId());
        }
        em.flush();
        em.clear();

        List<PmEvent> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
