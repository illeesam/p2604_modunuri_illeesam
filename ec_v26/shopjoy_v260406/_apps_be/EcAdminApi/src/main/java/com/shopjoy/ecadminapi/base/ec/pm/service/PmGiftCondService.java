package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftCondDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftCond;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmGiftCondMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmGiftCondRepository;
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
public class PmGiftCondService {

    private final PmGiftCondMapper pmGiftCondMapper;
    private final PmGiftCondRepository pmGiftCondRepository;

    @PersistenceContext
    private EntityManager em;

    public PmGiftCondDto.Item getById(String id) {
        PmGiftCondDto.Item dto = pmGiftCondMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PmGiftCond findById(String id) {
        return pmGiftCondRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pmGiftCondRepository.existsById(id);
    }

    public List<PmGiftCondDto.Item> getList(PmGiftCondDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pmGiftCondMapper.selectList(VoUtil.voToMap(req));
    }

    public PmGiftCondDto.PageResponse getPageData(PmGiftCondDto.Request req) {
        PageHelper.addPaging(req);
        PmGiftCondDto.PageResponse res = new PmGiftCondDto.PageResponse();
        List<PmGiftCondDto.Item> list = pmGiftCondMapper.selectPageList(VoUtil.voToMap(req));
        long count = pmGiftCondMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PmGiftCond create(PmGiftCond body) {
        body.setGiftCondId(CmUtil.generateId("pm_gift_cond"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmGiftCond saved = pmGiftCondRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmGiftCond save(PmGiftCond entity) {
        if (!existsById(entity.getGiftCondId()))
            throw new CmBizException("존재하지 않는 PmGiftCond입니다: " + entity.getGiftCondId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmGiftCond saved = pmGiftCondRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmGiftCond update(String id, PmGiftCond body) {
        PmGiftCond entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "giftCondId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmGiftCond saved = pmGiftCondRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmGiftCond updatePartial(PmGiftCond entity) {
        if (entity.getGiftCondId() == null) throw new CmBizException("giftCondId 가 필요합니다.");
        if (!existsById(entity.getGiftCondId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getGiftCondId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmGiftCondMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PmGiftCond entity = findById(id);
        pmGiftCondRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<PmGiftCond> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getGiftCondId() != null)
            .map(PmGiftCond::getGiftCondId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmGiftCondRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmGiftCond> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getGiftCondId() != null)
            .toList();
        for (PmGiftCond row : updateRows) {
            PmGiftCond entity = findById(row.getGiftCondId());
            VoUtil.voCopyExclude(row, entity, "giftCondId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmGiftCondRepository.save(entity);
        }
        em.flush();

        List<PmGiftCond> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmGiftCond row : insertRows) {
            row.setGiftCondId(CmUtil.generateId("pm_gift_cond"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmGiftCondRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
