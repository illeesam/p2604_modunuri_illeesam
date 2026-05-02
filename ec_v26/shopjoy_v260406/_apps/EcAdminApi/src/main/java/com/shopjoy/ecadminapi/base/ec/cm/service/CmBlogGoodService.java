package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogGoodDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogGood;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBlogGoodMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogGoodRepository;
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
public class CmBlogGoodService {

    private final CmBlogGoodMapper mapper;
    private final CmBlogGoodRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmBlogGoodDto getById(String id) {
        // cm_blog_good :: select one :: id [orm:mybatis]
        CmBlogGoodDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<CmBlogGoodDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // cm_blog_good :: select list :: p [orm:mybatis]
        List<CmBlogGoodDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<CmBlogGoodDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // cm_blog_good :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(CmBlogGood entity) {
        // cm_blog_good :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public CmBlogGood create(CmBlogGood entity) {
        entity.setLikeId(CmUtil.generateId("cm_blog_good"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_blog_good :: insert or update :: [orm:jpa]
        CmBlogGood result = repository.save(entity);
        return result;
    }

    @Transactional
    public CmBlogGood save(CmBlogGood entity) {
        if (!repository.existsById(entity.getLikeId()))
            throw new CmBizException("존재하지 않는 CmBlogGood입니다: " + entity.getLikeId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_blog_good :: insert or update :: [orm:jpa]
        CmBlogGood result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 CmBlogGood입니다: " + id);
        // cm_blog_good :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    @Transactional
    public void saveList(List<CmBlogGood> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (CmBlogGood row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setLikeId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("cm_blog_good"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                repository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getLikeId(), "likeId must not be null");
                CmBlogGood entity = repository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "likeId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                repository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getLikeId(), "likeId must not be null");
                if (repository.existsById(id)) repository.deleteById(id);
            }
        }
    }
}