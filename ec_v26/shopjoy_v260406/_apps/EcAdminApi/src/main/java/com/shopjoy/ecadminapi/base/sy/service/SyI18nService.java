package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18n;
import com.shopjoy.ecadminapi.base.sy.mapper.SyI18nMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyI18nRepository;
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
public class SyI18nService {

    private final SyI18nMapper syI18nMapper;
    private final SyI18nRepository syI18nRepository;

    @PersistenceContext
    private EntityManager em;

    public SyI18nDto.Item getById(String id) {
        SyI18nDto.Item dto = syI18nMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public SyI18n findById(String id) {
        return syI18nRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return syI18nRepository.existsById(id);
    }

    public List<SyI18nDto.Item> getList(SyI18nDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syI18nMapper.selectList(req);
    }

    public SyI18nDto.PageResponse getPageData(SyI18nDto.Request req) {
        PageHelper.addPaging(req);
        SyI18nDto.PageResponse res = new SyI18nDto.PageResponse();
        List<SyI18nDto.Item> list = syI18nMapper.selectPageList(req);
        long count = syI18nMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public SyI18n create(SyI18n body) {
        body.setI18nId(CmUtil.generateId("sy_i18n"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyI18n saved = syI18nRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getI18nId());
    }

    @Transactional
    public SyI18n save(SyI18n entity) {
        if (!existsById(entity.getI18nId()))
            throw new CmBizException("존재하지 않는 SyI18n입니다: " + entity.getI18nId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyI18n saved = syI18nRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getI18nId());
    }

    @Transactional
    public SyI18n update(String id, SyI18n body) {
        SyI18n entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "i18nId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyI18n saved = syI18nRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public SyI18n updatePartial(SyI18n entity) {
        if (entity.getI18nId() == null) throw new CmBizException("i18nId 가 필요합니다.");
        if (!existsById(entity.getI18nId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getI18nId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syI18nMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getI18nId());
    }

    @Transactional
    public void delete(String id) {
        SyI18n entity = findById(id);
        syI18nRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<SyI18n> saveList(List<SyI18n> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getI18nId() != null)
            .map(SyI18n::getI18nId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syI18nRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<SyI18n> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getI18nId() != null)
            .toList();
        for (SyI18n row : updateRows) {
            SyI18n entity = findById(row.getI18nId());
            VoUtil.voCopyExclude(row, entity, "i18nId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syI18nRepository.save(entity);
            upsertedIds.add(entity.getI18nId());
        }
        em.flush();

        List<SyI18n> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyI18n row : insertRows) {
            row.setI18nId(CmUtil.generateId("sy_i18n"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syI18nRepository.save(row);
            upsertedIds.add(row.getI18nId());
        }
        em.flush();
        em.clear();

        List<SyI18n> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
