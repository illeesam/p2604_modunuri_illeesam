package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogTagDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogTag;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBlogTagMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogTagRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;

@Service
@RequiredArgsConstructor
public class CmBlogTagService {

    private final CmBlogTagMapper cmBlogTagMapper;
    private final CmBlogTagRepository cmBlogTagRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmBlogTagDto getById(String id) {
        // cm_blog_tag :: select one :: id [orm:mybatis]
        CmBlogTagDto result = cmBlogTagMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<CmBlogTagDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // cm_blog_tag :: select list :: p [orm:mybatis]
        List<CmBlogTagDto> result = cmBlogTagMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<CmBlogTagDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // cm_blog_tag :: select page :: [orm:mybatis]
        return PageResult.of(cmBlogTagMapper.selectPageList(p), cmBlogTagMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(CmBlogTag entity) {
        // cm_blog_tag :: update :: [orm:mybatis]
        int result = cmBlogTagMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public CmBlogTag create(CmBlogTag entity) {
        entity.setBlogTagId(CmUtil.generateId("cm_blog_tag"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_blog_tag :: insert or update :: [orm:jpa]
        CmBlogTag result = cmBlogTagRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public CmBlogTag save(CmBlogTag entity) {
        if (!cmBlogTagRepository.existsById(entity.getBlogTagId()))
            throw new CmBizException("존재하지 않는 CmBlogTag입니다: " + entity.getBlogTagId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_blog_tag :: insert or update :: [orm:jpa]
        CmBlogTag result = cmBlogTagRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!cmBlogTagRepository.existsById(id))
            throw new CmBizException("존재하지 않는 CmBlogTag입니다: " + id);
        // cm_blog_tag :: delete :: id [orm:jpa]
        cmBlogTagRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<CmBlogTag> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (CmBlogTag row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setBlogTagId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("cm_blog_tag"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                cmBlogTagRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getBlogTagId(), "blogTagId must not be null");
                CmBlogTag entity = cmBlogTagRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "blogTagId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                cmBlogTagRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getBlogTagId(), "blogTagId must not be null");
                if (cmBlogTagRepository.existsById(id)) cmBlogTagRepository.deleteById(id);
            }
        }
    }
}