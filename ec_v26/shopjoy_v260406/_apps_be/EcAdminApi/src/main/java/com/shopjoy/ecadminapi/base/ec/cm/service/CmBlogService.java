package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogRepository;
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
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmBlogService {

    private final CmBlogRepository cmBlogRepository;

    @PersistenceContext
    private EntityManager em;

    public CmBlogDto.Item getById(String id) {
        CmBlogDto.Item dto = cmBlogRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmBlogDto.Item getByIdOrNull(String id) {
        return cmBlogRepository.selectById(id).orElse(null);
    }

    public CmBlog findById(String id) {
        return cmBlogRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmBlog findByIdOrNull(String id) {
        return cmBlogRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return cmBlogRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!cmBlogRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<CmBlogDto.Item> getList(CmBlogDto.Request req) {
        return cmBlogRepository.selectList(req);
    }

    public CmBlogDto.PageResponse getPageData(CmBlogDto.Request req) {
        PageHelper.addPaging(req);
        return cmBlogRepository.selectPageList(req);
    }

    @Transactional
    public CmBlog create(CmBlog body) {
        body.setBlogId(CmUtil.generateId("cm_blog"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmBlog saved = cmBlogRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmBlog save(CmBlog entity) {
        if (!existsById(entity.getBlogId()))
            throw new CmBizException("존재하지 않는 CmBlog입니다: " + entity.getBlogId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmBlog saved = cmBlogRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmBlog update(String id, CmBlog body) {
        CmBlog entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "blogId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmBlog saved = cmBlogRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmBlog updateSelective(CmBlog entity) {
        if (entity.getBlogId() == null) throw new CmBizException("blogId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getBlogId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBlogId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmBlogRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        CmBlog entity = findById(id);
        cmBlogRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<CmBlog> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getBlogId() != null)
            .map(CmBlog::getBlogId)
            .toList();
        if (!deleteIds.isEmpty()) {
            cmBlogRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<CmBlog> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getBlogId() != null)
            .toList();
        for (CmBlog row : updateRows) {
            CmBlog entity = findById(row.getBlogId());
            VoUtil.voCopyExclude(row, entity, "blogId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            cmBlogRepository.save(entity);
        }
        em.flush();

        List<CmBlog> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (CmBlog row : insertRows) {
            row.setBlogId(CmUtil.generateId("cm_blog"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            cmBlogRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
