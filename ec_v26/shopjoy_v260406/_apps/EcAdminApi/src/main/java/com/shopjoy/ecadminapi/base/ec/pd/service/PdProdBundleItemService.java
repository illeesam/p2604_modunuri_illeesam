package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdBundleItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdBundleItem;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdBundleItemMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdBundleItemRepository;
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
public class PdProdBundleItemService {

    private final PdProdBundleItemMapper pdProdBundleItemMapper;
    private final PdProdBundleItemRepository pdProdBundleItemRepository;

    @PersistenceContext
    private EntityManager em;

    public PdProdBundleItemDto.Item getById(String id) {
        PdProdBundleItemDto.Item dto = pdProdBundleItemMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdProdBundleItem findById(String id) {
        return pdProdBundleItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pdProdBundleItemRepository.existsById(id);
    }

    public List<PdProdBundleItemDto.Item> getList(PdProdBundleItemDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdProdBundleItemMapper.selectList(req);
    }

    public PdProdBundleItemDto.PageResponse getPageData(PdProdBundleItemDto.Request req) {
        PageHelper.addPaging(req);
        PdProdBundleItemDto.PageResponse res = new PdProdBundleItemDto.PageResponse();
        List<PdProdBundleItemDto.Item> list = pdProdBundleItemMapper.selectPageList(req);
        long count = pdProdBundleItemMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdProdBundleItem create(PdProdBundleItem body) {
        body.setBundleItemId(CmUtil.generateId("pd_prod_bundle_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProdBundleItem saved = pdProdBundleItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getBundleItemId());
    }

    @Transactional
    public PdProdBundleItem save(PdProdBundleItem entity) {
        if (!existsById(entity.getBundleItemId()))
            throw new CmBizException("존재하지 않는 PdProdBundleItem입니다: " + entity.getBundleItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdBundleItem saved = pdProdBundleItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getBundleItemId());
    }

    @Transactional
    public PdProdBundleItem update(String id, PdProdBundleItem body) {
        PdProdBundleItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "bundleItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdBundleItem saved = pdProdBundleItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public PdProdBundleItem updatePartial(PdProdBundleItem entity) {
        if (entity.getBundleItemId() == null) throw new CmBizException("bundleItemId 가 필요합니다.");
        if (!existsById(entity.getBundleItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBundleItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdBundleItemMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getBundleItemId());
    }

    @Transactional
    public void delete(String id) {
        PdProdBundleItem entity = findById(id);
        pdProdBundleItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<PdProdBundleItem> saveList(List<PdProdBundleItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getBundleItemId() != null)
            .map(PdProdBundleItem::getBundleItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdBundleItemRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<PdProdBundleItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getBundleItemId() != null)
            .toList();
        for (PdProdBundleItem row : updateRows) {
            PdProdBundleItem entity = findById(row.getBundleItemId());
            VoUtil.voCopyExclude(row, entity, "bundleItemId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdProdBundleItemRepository.save(entity);
            upsertedIds.add(entity.getBundleItemId());
        }
        em.flush();

        List<PdProdBundleItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProdBundleItem row : insertRows) {
            row.setBundleItemId(CmUtil.generateId("pd_prod_bundle_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdBundleItemRepository.save(row);
            upsertedIds.add(row.getBundleItemId());
        }
        em.flush();
        em.clear();

        List<PdProdBundleItem> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
