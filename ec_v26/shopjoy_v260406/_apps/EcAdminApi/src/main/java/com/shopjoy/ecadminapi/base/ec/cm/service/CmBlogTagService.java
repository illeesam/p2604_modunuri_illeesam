package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogTagDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogTag;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBlogTagMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogTagRepository;
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
public class CmBlogTagService {

    private final CmBlogTagMapper cmBlogTagMapper;
    private final CmBlogTagRepository cmBlogTagRepository;

    @PersistenceContext
    private EntityManager em;

    public CmBlogTagDto.Item getById(String id) {
        CmBlogTagDto.Item dto = cmBlogTagMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public CmBlogTag findById(String id) {
        return cmBlogTagRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return cmBlogTagRepository.existsById(id);
    }

    public List<CmBlogTagDto.Item> getList(CmBlogTagDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return cmBlogTagMapper.selectList(req);
    }

    public CmBlogTagDto.PageResponse getPageData(CmBlogTagDto.Request req) {
        PageHelper.addPaging(req);
        CmBlogTagDto.PageResponse res = new CmBlogTagDto.PageResponse();
        List<CmBlogTagDto.Item> list = cmBlogTagMapper.selectPageList(req);
        long count = cmBlogTagMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public CmBlogTag create(CmBlogTag body) {
        body.setBlogTagId(CmUtil.generateId("cm_blog_tag"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmBlogTag saved = cmBlogTagRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getBlogTagId());
    }

    @Transactional
    public CmBlogTag save(CmBlogTag entity) {
        if (!existsById(entity.getBlogTagId()))
            throw new CmBizException("존재하지 않는 CmBlogTag입니다: " + entity.getBlogTagId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmBlogTag saved = cmBlogTagRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getBlogTagId());
    }

    @Transactional
    public CmBlogTag update(String id, CmBlogTag body) {
        CmBlogTag entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "blogTagId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmBlogTag saved = cmBlogTagRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public CmBlogTag updatePartial(CmBlogTag entity) {
        if (entity.getBlogTagId() == null) throw new CmBizException("blogTagId 가 필요합니다.");
        if (!existsById(entity.getBlogTagId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBlogTagId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmBlogTagMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getBlogTagId());
    }

    @Transactional
    public void delete(String id) {
        CmBlogTag entity = findById(id);
        cmBlogTagRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<CmBlogTag> saveList(List<CmBlogTag> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getBlogTagId() != null)
            .map(CmBlogTag::getBlogTagId)
            .toList();
        if (!deleteIds.isEmpty()) {
            cmBlogTagRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<CmBlogTag> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getBlogTagId() != null)
            .toList();
        for (CmBlogTag row : updateRows) {
            CmBlogTag entity = findById(row.getBlogTagId());
            VoUtil.voCopyExclude(row, entity, "blogTagId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            cmBlogTagRepository.save(entity);
            upsertedIds.add(entity.getBlogTagId());
        }
        em.flush();

        List<CmBlogTag> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (CmBlogTag row : insertRows) {
            row.setBlogTagId(CmUtil.generateId("cm_blog_tag"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            cmBlogTagRepository.save(row);
            upsertedIds.add(row.getBlogTagId());
        }
        em.flush();
        em.clear();

        List<CmBlogTag> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
