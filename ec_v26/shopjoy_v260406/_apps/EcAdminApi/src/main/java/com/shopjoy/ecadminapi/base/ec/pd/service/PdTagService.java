package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdTag;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdTagMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdTagRepository;
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
public class PdTagService {

    private final PdTagMapper pdTagMapper;
    private final PdTagRepository pdTagRepository;

    @PersistenceContext
    private EntityManager em;

    public PdTagDto.Item getById(String id) {
        PdTagDto.Item dto = pdTagMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdTag findById(String id) {
        return pdTagRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pdTagRepository.existsById(id);
    }

    public List<PdTagDto.Item> getList(PdTagDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdTagMapper.selectList(req);
    }

    public PdTagDto.PageResponse getPageData(PdTagDto.Request req) {
        PageHelper.addPaging(req);
        PdTagDto.PageResponse res = new PdTagDto.PageResponse();
        List<PdTagDto.Item> list = pdTagMapper.selectPageList(req);
        long count = pdTagMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdTag create(PdTag body) {
        body.setTagId(CmUtil.generateId("pd_tag"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdTag saved = pdTagRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getTagId());
    }

    @Transactional
    public PdTag save(PdTag entity) {
        if (!existsById(entity.getTagId()))
            throw new CmBizException("존재하지 않는 PdTag입니다: " + entity.getTagId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdTag saved = pdTagRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getTagId());
    }

    @Transactional
    public PdTag update(String id, PdTag body) {
        PdTag entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "tagId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdTag saved = pdTagRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public PdTag updatePartial(PdTag entity) {
        if (entity.getTagId() == null) throw new CmBizException("tagId 가 필요합니다.");
        if (!existsById(entity.getTagId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getTagId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdTagMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getTagId());
    }

    @Transactional
    public void delete(String id) {
        PdTag entity = findById(id);
        pdTagRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<PdTag> saveList(List<PdTag> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getTagId() != null)
            .map(PdTag::getTagId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdTagRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<PdTag> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getTagId() != null)
            .toList();
        for (PdTag row : updateRows) {
            PdTag entity = findById(row.getTagId());
            VoUtil.voCopyExclude(row, entity, "tagId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdTagRepository.save(entity);
            upsertedIds.add(entity.getTagId());
        }
        em.flush();

        List<PdTag> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdTag row : insertRows) {
            row.setTagId(CmUtil.generateId("pd_tag"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdTagRepository.save(row);
            upsertedIds.add(row.getTagId());
        }
        em.flush();
        em.clear();

        List<PdTag> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
