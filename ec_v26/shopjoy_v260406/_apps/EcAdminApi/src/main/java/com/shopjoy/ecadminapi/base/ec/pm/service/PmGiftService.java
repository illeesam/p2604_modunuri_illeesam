package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmGiftMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmGiftRepository;
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
public class PmGiftService {

    private final PmGiftMapper pmGiftMapper;
    private final PmGiftRepository pmGiftRepository;

    @PersistenceContext
    private EntityManager em;

    public PmGiftDto.Item getById(String id) {
        PmGiftDto.Item dto = pmGiftMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PmGift findById(String id) {
        return pmGiftRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pmGiftRepository.existsById(id);
    }

    public List<PmGiftDto.Item> getList(PmGiftDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pmGiftMapper.selectList(req);
    }

    public PmGiftDto.PageResponse getPageData(PmGiftDto.Request req) {
        PageHelper.addPaging(req);
        PmGiftDto.PageResponse res = new PmGiftDto.PageResponse();
        List<PmGiftDto.Item> list = pmGiftMapper.selectPageList(req);
        long count = pmGiftMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PmGift create(PmGift body) {
        body.setGiftId(CmUtil.generateId("pm_gift"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmGift saved = pmGiftRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getGiftId());
    }

    @Transactional
    public PmGift save(PmGift entity) {
        if (!existsById(entity.getGiftId()))
            throw new CmBizException("존재하지 않는 PmGift입니다: " + entity.getGiftId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmGift saved = pmGiftRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getGiftId());
    }

    @Transactional
    public PmGift update(String id, PmGift body) {
        PmGift entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "giftId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmGift saved = pmGiftRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public PmGift updatePartial(PmGift entity) {
        if (entity.getGiftId() == null) throw new CmBizException("giftId 가 필요합니다.");
        if (!existsById(entity.getGiftId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getGiftId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmGiftMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getGiftId());
    }

    @Transactional
    public void delete(String id) {
        PmGift entity = findById(id);
        pmGiftRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<PmGift> saveList(List<PmGift> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getGiftId() != null)
            .map(PmGift::getGiftId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmGiftRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<PmGift> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getGiftId() != null)
            .toList();
        for (PmGift row : updateRows) {
            PmGift entity = findById(row.getGiftId());
            VoUtil.voCopyExclude(row, entity, "giftId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmGiftRepository.save(entity);
            upsertedIds.add(entity.getGiftId());
        }
        em.flush();

        List<PmGift> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmGift row : insertRows) {
            row.setGiftId(CmUtil.generateId("pm_gift"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmGiftRepository.save(row);
            upsertedIds.add(row.getGiftId());
        }
        em.flush();
        em.clear();

        List<PmGift> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
