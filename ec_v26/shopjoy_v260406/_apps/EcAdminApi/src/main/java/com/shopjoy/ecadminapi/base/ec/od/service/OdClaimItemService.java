package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaimItem;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdClaimItemMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdClaimItemRepository;
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
public class OdClaimItemService {

    private final OdClaimItemMapper odClaimItemMapper;
    private final OdClaimItemRepository odClaimItemRepository;

    @PersistenceContext
    private EntityManager em;

    public OdClaimItemDto.Item getById(String id) {
        OdClaimItemDto.Item dto = odClaimItemMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdClaimItem findById(String id) {
        return odClaimItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odClaimItemRepository.existsById(id);
    }

    public List<OdClaimItemDto.Item> getList(OdClaimItemDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odClaimItemMapper.selectList(VoUtil.voToMap(req));
    }

    public OdClaimItemDto.PageResponse getPageData(OdClaimItemDto.Request req) {
        PageHelper.addPaging(req);
        OdClaimItemDto.PageResponse res = new OdClaimItemDto.PageResponse();
        List<OdClaimItemDto.Item> list = odClaimItemMapper.selectPageList(VoUtil.voToMap(req));
        long count = odClaimItemMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdClaimItem create(OdClaimItem body) {
        body.setClaimItemId(CmUtil.generateId("od_claim_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdClaimItem saved = odClaimItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdClaimItem save(OdClaimItem entity) {
        if (!existsById(entity.getClaimItemId()))
            throw new CmBizException("존재하지 않는 OdClaimItem입니다: " + entity.getClaimItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdClaimItem saved = odClaimItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdClaimItem update(String id, OdClaimItem body) {
        OdClaimItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "claimItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdClaimItem saved = odClaimItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdClaimItem updatePartial(OdClaimItem entity) {
        if (entity.getClaimItemId() == null) throw new CmBizException("claimItemId 가 필요합니다.");
        if (!existsById(entity.getClaimItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getClaimItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odClaimItemMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdClaimItem entity = findById(id);
        odClaimItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<OdClaimItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getClaimItemId() != null)
            .map(OdClaimItem::getClaimItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odClaimItemRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdClaimItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getClaimItemId() != null)
            .toList();
        for (OdClaimItem row : updateRows) {
            OdClaimItem entity = findById(row.getClaimItemId());
            VoUtil.voCopyExclude(row, entity, "claimItemId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odClaimItemRepository.save(entity);
        }
        em.flush();

        List<OdClaimItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdClaimItem row : insertRows) {
            row.setClaimItemId(CmUtil.generateId("od_claim_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odClaimItemRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
