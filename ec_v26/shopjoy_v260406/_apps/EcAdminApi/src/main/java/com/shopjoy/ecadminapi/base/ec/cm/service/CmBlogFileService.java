package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogFileDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogFile;
import com.shopjoy.ecadminapi.base.ec.cm.data.vo.CmBlogFileReq;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBlogFileMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogFileRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CmBlogFileService {

    private final CmBlogFileMapper mapper;
    private final CmBlogFileRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmBlogFileDto getById(String id) {
        // cm_blog_file :: select one :: id [orm:mybatis]
        return mapper.selectById(id);
    }

    @Transactional(readOnly = true)
    public List<CmBlogFileDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // cm_blog_file :: select list :: p [orm:mybatis]
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<CmBlogFileDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // cm_blog_file :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(CmBlogFile entity) {
        // cm_blog_file :: update :: [orm:mybatis]
        return mapper.updateSelective(entity);
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public CmBlogFile create(CmBlogFile entity) {
        entity.setBlogImgId(CmUtil.generateId("cm_blog_file"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_blog_file :: insert or update :: [orm:jpa]
        return repository.save(entity);
    }

    @Transactional
    public CmBlogFile save(CmBlogFile entity) {
        // cm_blog_file :: select one :: blogImgId [orm:jpa]
        CmBlogFile existing = repository.findById(entity.getBlogImgId())
                .orElseThrow(() -> new CmBizException("존재하지 않는 파일입니다: " + entity.getBlogImgId()));
        entity.setRegBy(existing.getRegBy());
        entity.setRegDate(existing.getRegDate());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_blog_file :: insert or update :: [orm:jpa]
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 파일입니다: " + id);
        // cm_blog_file :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    // ── _row_status 기반 저장 ────────────────────────────────────

    @Transactional
    public CmBlogFile saveByRowStatus(CmBlogFileReq req) {
        return doSaveByRowStatus(req);
    }

    // D → U → I 순서로 처리: 삭제 후 수정, 마지막에 신규 등록하여 유니크 제약 충돌 방지
    @Transactional
    public List<CmBlogFile> saveListByRowStatus(List<CmBlogFileReq> list) {
        List<CmBlogFile> result = new ArrayList<>();
        for (CmBlogFileReq req : list.stream().filter(r -> "D".equals(r.getRowStatus())).toList()) result.add(doSaveByRowStatus(req));
        for (CmBlogFileReq req : list.stream().filter(r -> "U".equals(r.getRowStatus())).toList()) result.add(doSaveByRowStatus(req));
        for (CmBlogFileReq req : list.stream().filter(r -> "I".equals(r.getRowStatus())).toList()) result.add(doSaveByRowStatus(req));
        return result;
    }

    private CmBlogFile doSaveByRowStatus(CmBlogFileReq req) {
        return switch (req.getRowStatus()) {
            case "I" -> create(req.toEntity());
            case "U" -> save(req.toEntity());
            case "D" -> {
                delete(req.getBlogImgId());
                yield null;
            }
            default -> throw new CmBizException("올바르지 않은 _row_status: " + req.getRowStatus());
        };
    }

}
