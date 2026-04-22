package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogReplyDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogReply;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBlogReplyMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogReplyRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CmBlogReplyService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final CmBlogReplyMapper mapper;
    private final CmBlogReplyRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmBlogReplyDto getById(String id) {
        CmBlogReplyDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<CmBlogReplyDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<CmBlogReplyDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<CmBlogReplyDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(CmBlogReply entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public CmBlogReply create(CmBlogReply entity) {
        entity.setCommentId(generateId());
        entity.setRegBy(SecurityUtil.getUserId());
        entity.setRegDate(LocalDateTime.now());
        CmBlogReply result = repository.save(entity);
        return result;
    }

    @Transactional
    public CmBlogReply save(CmBlogReply entity) {
        if (!repository.existsById(entity.getCommentId()))
            throw new CmBizException("존재하지 않는 CmBlogReply입니다: " + entity.getCommentId());
        entity.setUpdBy(SecurityUtil.getUserId());
        entity.setUpdDate(LocalDateTime.now());
        CmBlogReply result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 CmBlogReply입니다: " + id);
        repository.deleteById(id);
    }

    /** ID 생성: prefix=BLR (cm_blog_reply) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "BLR" + ts + rand;
    }
}
