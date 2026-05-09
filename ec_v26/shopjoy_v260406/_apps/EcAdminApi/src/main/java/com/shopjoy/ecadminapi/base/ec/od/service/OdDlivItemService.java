package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDlivItem;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdDlivItemMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdDlivItemRepository;
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
public class OdDlivItemService {

    private final OdDlivItemMapper odDlivItemMapper;
    private final OdDlivItemRepository odDlivItemRepository;

    @PersistenceContext
    private EntityManager em;

    public OdDlivItemDto.Item getById(String id) {
        OdDlivItemDto.Item dto = odDlivItemMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdDlivItem findById(String id) {
        return odDlivItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odDlivItemRepository.existsById(id);
    }

    public List<OdDlivItemDto.Item> getList(OdDlivItemDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odDlivItemMapper.selectList(req);
    }

    public OdDlivItemDto.PageResponse getPageData(OdDlivItemDto.Request req) {
        PageHelper.addPaging(req);
        OdDlivItemDto.PageResponse res = new OdDlivItemDto.PageResponse();
        List<OdDlivItemDto.Item> list = odDlivItemMapper.selectPageList(req);
        long count = odDlivItemMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdDlivItem create(OdDlivItem body) {
        body.setDlivItemId(CmUtil.generateId("od_dliv_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdDlivItem saved = odDlivItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getDlivItemId());
    }

    @Transactional
    public OdDlivItem save(OdDlivItem entity) {
        if (!existsById(entity.getDlivItemId()))
            throw new CmBizException("존재하지 않는 OdDlivItem입니다: " + entity.getDlivItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdDlivItem saved = odDlivItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getDlivItemId());
    }

    @Transactional
    public OdDlivItem update(String id, OdDlivItem body) {
        OdDlivItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "dlivItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdDlivItem saved = odDlivItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public OdDlivItem updatePartial(OdDlivItem entity) {
        if (entity.getDlivItemId() == null) throw new CmBizException("dlivItemId 가 필요합니다.");
        if (!existsById(entity.getDlivItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDlivItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odDlivItemMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getDlivItemId());
    }

    @Transactional
    public void delete(String id) {
        OdDlivItem entity = findById(id);
        odDlivItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<OdDlivItem> saveList(List<OdDlivItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getDlivItemId() != null)
            .map(OdDlivItem::getDlivItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odDlivItemRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<OdDlivItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getDlivItemId() != null)
            .toList();
        for (OdDlivItem row : updateRows) {
            OdDlivItem entity = findById(row.getDlivItemId());
            VoUtil.voCopyExclude(row, entity, "dlivItemId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odDlivItemRepository.save(entity);
            upsertedIds.add(entity.getDlivItemId());
        }
        em.flush();

        List<OdDlivItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdDlivItem row : insertRows) {
            row.setDlivItemId(CmUtil.generateId("od_dliv_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odDlivItemRepository.save(row);
            upsertedIds.add(row.getDlivItemId());
        }
        em.flush();
        em.clear();

        List<OdDlivItem> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
