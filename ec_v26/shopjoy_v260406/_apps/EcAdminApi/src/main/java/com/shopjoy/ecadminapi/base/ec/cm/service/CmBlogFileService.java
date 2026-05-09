package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogFileDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogFile;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBlogFileMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogFileRepository;
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
public class CmBlogFileService {

    private final CmBlogFileMapper cmBlogFileMapper;
    private final CmBlogFileRepository cmBlogFileRepository;

    @PersistenceContext
    private EntityManager em;

    public CmBlogFileDto.Item getById(String id) {
        CmBlogFileDto.Item dto = cmBlogFileMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public CmBlogFile findById(String id) {
        return cmBlogFileRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return cmBlogFileRepository.existsById(id);
    }

    public List<CmBlogFileDto.Item> getList(CmBlogFileDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return cmBlogFileMapper.selectList(req);
    }

    public CmBlogFileDto.PageResponse getPageData(CmBlogFileDto.Request req) {
        PageHelper.addPaging(req);
        CmBlogFileDto.PageResponse res = new CmBlogFileDto.PageResponse();
        List<CmBlogFileDto.Item> list = cmBlogFileMapper.selectPageList(req);
        long count = cmBlogFileMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public CmBlogFile create(CmBlogFile body) {
        body.setBlogImgId(CmUtil.generateId("cm_blog_file"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmBlogFile saved = cmBlogFileRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public CmBlogFile save(CmBlogFile entity) {
        if (!existsById(entity.getBlogImgId()))
            throw new CmBizException("존재하지 않는 CmBlogFile입니다: " + entity.getBlogImgId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmBlogFile saved = cmBlogFileRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public CmBlogFile update(String id, CmBlogFile body) {
        CmBlogFile entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "blogImgId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmBlogFile saved = cmBlogFileRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public CmBlogFile updatePartial(CmBlogFile entity) {
        if (entity.getBlogImgId() == null) throw new CmBizException("blogImgId 가 필요합니다.");
        if (!existsById(entity.getBlogImgId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBlogImgId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmBlogFileMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        CmBlogFile entity = findById(id);
        cmBlogFileRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<CmBlogFile> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getBlogImgId() != null)
            .map(CmBlogFile::getBlogImgId)
            .toList();
        if (!deleteIds.isEmpty()) {
            cmBlogFileRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<CmBlogFile> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getBlogImgId() != null)
            .toList();
        for (CmBlogFile row : updateRows) {
            CmBlogFile entity = findById(row.getBlogImgId());
            VoUtil.voCopyExclude(row, entity, "blogImgId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            cmBlogFileRepository.save(entity);
        }
        em.flush();

        List<CmBlogFile> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (CmBlogFile row : insertRows) {
            row.setBlogImgId(CmUtil.generateId("cm_blog_file"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            cmBlogFileRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
