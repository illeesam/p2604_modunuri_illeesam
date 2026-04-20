package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBltnReplyDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltnReply;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBltnReplyMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBltnReplyRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CmBltnReplyService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final CmBltnReplyMapper mapper;
    private final CmBltnReplyRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmBltnReplyDto getById(String id) {
        CmBltnReplyDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<CmBltnReplyDto> getList(Map<String, Object> p) {
        List<CmBltnReplyDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<CmBltnReplyDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<CmBltnReplyDto> pageList = mapper.selectPageList(p);
        PageResult<CmBltnReplyDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(CmBltnReply entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public CmBltnReply create(CmBltnReply entity) {
        entity.setCommentId(generateId());
        entity.setRegBy(SecurityUtil.currentUserId());
        entity.setRegDate(LocalDateTime.now());
        CmBltnReply result = repository.save(entity);
        return result;
    }

    @Transactional
    public CmBltnReply save(CmBltnReply entity) {
        if (!repository.existsById(entity.getCommentId()))
            throw new CmBizException("존재하지 않는 CmBltnReply입니다: " + entity.getCommentId());
        entity.setUpdBy(SecurityUtil.currentUserId());
        entity.setUpdDate(LocalDateTime.now());
        CmBltnReply result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 CmBltnReply입니다: " + id);
        repository.deleteById(id);
    }

    /** ID 생성: prefix=BLR (cm_bltn_reply) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "BLR" + ts + rand;
    }
}
