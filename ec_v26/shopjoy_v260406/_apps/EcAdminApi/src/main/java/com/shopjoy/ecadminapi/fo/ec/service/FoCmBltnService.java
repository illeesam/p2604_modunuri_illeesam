package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBltnDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltn;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBltnMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBltnRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * FO 게시물(블로그/FAQ/공지) 서비스
 * URL: /api/fo/ec/cm/bltn
 *
 * - 블로그 목록/상세: blogCateId 필터링
 * - FAQ: blogCateId 또는 kw 검색
 * - 상세 조회 시 viewCount 자동 증가
 */
@Service
@RequiredArgsConstructor
public class FoCmBltnService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final CmBltnMapper     mapper;
    private final CmBltnRepository repository;

    @Transactional(readOnly = true)
    public List<CmBltnDto> getList(Map<String, Object> p) {
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<CmBltnDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        Map<String, Object> param = new HashMap<>(p);
        param.put("limit",  pageSize);
        param.put("offset", (pageNo - 1) * pageSize);
        return PageResult.of(mapper.selectPageList(param), mapper.selectPageCount(param), pageNo, pageSize, p);
    }

    @Transactional
    public CmBltnDto getByIdAndIncrView(String blogId) {
        CmBltn entity = repository.findById(blogId)
                .orElseThrow(() -> new CmBizException("존재하지 않는 게시물입니다: " + blogId));
        entity.setViewCount((entity.getViewCount() != null ? entity.getViewCount() : 0) + 1);
        repository.save(entity);
        return mapper.selectById(blogId);
    }

    @Transactional
    public CmBltn create(CmBltn entity) {
        entity.setBlogId(generateId());
        entity.setRegBy(SecurityUtil.currentUserId());
        entity.setRegDate(LocalDateTime.now());
        if (entity.getUseYn() == null) entity.setUseYn("Y");
        if (entity.getViewCount() == null) entity.setViewCount(0);
        return repository.save(entity);
    }

    @Transactional
    public CmBltn update(String blogId, CmBltn entity) {
        CmBltn existing = repository.findById(blogId)
                .orElseThrow(() -> new CmBizException("존재하지 않는 게시물입니다: " + blogId));
        if (!existing.getRegBy().equals(SecurityUtil.currentUserId()) && !SecurityUtil.isUser())
            throw new CmBizException("수정 권한이 없습니다.");
        entity.setBlogId(blogId);
        entity.setRegBy(existing.getRegBy());
        entity.setRegDate(existing.getRegDate());
        entity.setUpdBy(SecurityUtil.currentUserId());
        entity.setUpdDate(LocalDateTime.now());
        return repository.save(entity);
    }

    @Transactional
    public void delete(String blogId) {
        CmBltn existing = repository.findById(blogId)
                .orElseThrow(() -> new CmBizException("존재하지 않는 게시물입니다: " + blogId));
        if (!existing.getRegBy().equals(SecurityUtil.currentUserId()) && !SecurityUtil.isUser())
            throw new CmBizException("삭제 권한이 없습니다.");
        repository.deleteById(blogId);
    }

    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int) (Math.random() * 10000));
        return "BL" + ts + rand;
    }
}
