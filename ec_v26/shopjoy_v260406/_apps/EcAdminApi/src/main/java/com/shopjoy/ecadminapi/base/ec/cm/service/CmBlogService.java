package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBlogMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogRepository;
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
public class CmBlogService {

    private final CmBlogMapper cmBlogMapper;
    private final CmBlogRepository cmBlogRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmBlogDto getById(String id) {
        // cm_blog :: select one :: id [orm:mybatis]
        CmBlogDto result = cmBlogMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<CmBlogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // cm_blog :: select list :: p [orm:mybatis]
        List<CmBlogDto> result = cmBlogMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<CmBlogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // cm_blog :: select page :: [orm:mybatis]
        return PageResult.of(cmBlogMapper.selectPageList(p), cmBlogMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(CmBlog entity) {
        // cm_blog :: update :: [orm:mybatis]
        int result = cmBlogMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public CmBlog create(CmBlog entity) {
        entity.setBlogId(CmUtil.generateId("cm_blog"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_blog :: insert or update :: [orm:jpa]
        CmBlog result = cmBlogRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public CmBlog save(CmBlog entity) {
        if (!cmBlogRepository.existsById(entity.getBlogId()))
            throw new CmBizException("존재하지 않는 CmBlog입니다: " + entity.getBlogId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_blog :: insert or update :: [orm:jpa]
        CmBlog result = cmBlogRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!cmBlogRepository.existsById(id))
            throw new CmBizException("존재하지 않는 CmBlog입니다: " + id);
        // cm_blog :: delete :: id [orm:jpa]
        cmBlogRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<CmBlog> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (CmBlog row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setBlogId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("cm_blog"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                cmBlogRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getBlogId(), "blogId must not be null");
                CmBlog entity = cmBlogRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "blogId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                cmBlogRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getBlogId(), "blogId must not be null");
                if (cmBlogRepository.existsById(id)) cmBlogRepository.deleteById(id);
            }
        }
    }
}