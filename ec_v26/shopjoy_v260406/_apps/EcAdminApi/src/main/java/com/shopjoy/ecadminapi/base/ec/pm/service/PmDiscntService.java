package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscnt;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmDiscntMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmDiscntRepository;
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
public class PmDiscntService {

    private final PmDiscntMapper pmDiscntMapper;
    private final PmDiscntRepository pmDiscntRepository;

    @PersistenceContext
    private EntityManager em;

    public PmDiscntDto.Item getById(String id) {
        PmDiscntDto.Item dto = pmDiscntMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PmDiscnt findById(String id) {
        return pmDiscntRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pmDiscntRepository.existsById(id);
    }

    public List<PmDiscntDto.Item> getList(PmDiscntDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pmDiscntMapper.selectList(req);
    }

    public PmDiscntDto.PageResponse getPageData(PmDiscntDto.Request req) {
        PageHelper.addPaging(req);
        PmDiscntDto.PageResponse res = new PmDiscntDto.PageResponse();
        List<PmDiscntDto.Item> list = pmDiscntMapper.selectPageList(req);
        long count = pmDiscntMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PmDiscnt create(PmDiscnt body) {
        body.setDiscntId(CmUtil.generateId("pm_discnt"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmDiscnt saved = pmDiscntRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmDiscnt save(PmDiscnt entity) {
        if (!existsById(entity.getDiscntId()))
            throw new CmBizException("존재하지 않는 PmDiscnt입니다: " + entity.getDiscntId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmDiscnt saved = pmDiscntRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmDiscnt update(String id, PmDiscnt body) {
        PmDiscnt entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "discntId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmDiscnt saved = pmDiscntRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmDiscnt updatePartial(PmDiscnt entity) {
        if (entity.getDiscntId() == null) throw new CmBizException("discntId 가 필요합니다.");
        if (!existsById(entity.getDiscntId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDiscntId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmDiscntMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PmDiscnt entity = findById(id);
        pmDiscntRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<PmDiscnt> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getDiscntId() != null)
            .map(PmDiscnt::getDiscntId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmDiscntRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmDiscnt> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getDiscntId() != null)
            .toList();
        for (PmDiscnt row : updateRows) {
            PmDiscnt entity = findById(row.getDiscntId());
            VoUtil.voCopyExclude(row, entity, "discntId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmDiscntRepository.save(entity);
        }
        em.flush();

        List<PmDiscnt> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmDiscnt row : insertRows) {
            row.setDiscntId(CmUtil.generateId("pm_discnt"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmDiscntRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
