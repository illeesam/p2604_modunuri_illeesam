package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.dto.CmBltnCateDto;
import com.shopjoy.ecadminapi.base.ec.cm.dto.CmBltnCateReq;
import com.shopjoy.ecadminapi.base.ec.cm.entity.CmBltnCate;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBltnCateMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBltnCateRepository;
import com.shopjoy.ecadminapi.common.exception.BusinessException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CmBltnCateService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final CmBltnCateMapper mapper;
    private final CmBltnCateRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmBltnCateDto getById(String id) {
        return mapper.selectById(id);
    }

    @Transactional(readOnly = true)
    public List<CmBltnCateDto> getList(Map<String, Object> p) {
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<CmBltnCateDto> getPageList(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long total = mapper.selectPageCount(p);
        List<CmBltnCateDto> content = mapper.selectPageList(p);
        return PageResult.of(content, total, pageNo, pageSize);
    }

    @Transactional
    public int update(CmBltnCate entity) {
        return mapper.updateSelective(entity);
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public CmBltnCate create(CmBltnCate entity) {
        entity.setBlogCateId(generateId());
        entity.setRegBy(SecurityUtil.currentUserId());
        entity.setRegDate(LocalDateTime.now());
        return repository.save(entity);
    }

    @Transactional
    public CmBltnCate save(CmBltnCate entity) {
        if (!repository.existsById(entity.getBlogCateId())) {
            throw new BusinessException("존재하지 않는 카테고리입니다: " + entity.getBlogCateId());
        }
        entity.setUpdBy(SecurityUtil.currentUserId());
        entity.setUpdDate(LocalDateTime.now());
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id)) {
            throw new BusinessException("존재하지 않는 카테고리입니다: " + id);
        }
        repository.deleteById(id);
    }

    // ── _row_status 기반 저장 ────────────────────────────────────

    @Transactional
    public CmBltnCate saveByRowStatus(CmBltnCateReq req) {
        return doSaveByRowStatus(req);
    }

    @Transactional
    public List<CmBltnCate> saveListByRowStatus(List<CmBltnCateReq> list) {
        List<CmBltnCate> result = new ArrayList<>();
        for (CmBltnCateReq req : list) {
            result.add(doSaveByRowStatus(req));
        }
        return result;
    }

    private CmBltnCate doSaveByRowStatus(CmBltnCateReq req) {
        return switch (req.getRowStatus()) {
            case "I" -> create(req.toEntity());
            case "U" -> {
                if (!repository.existsById(req.getBlogCateId()))
                    throw new BusinessException("존재하지 않는 카테고리입니다: " + req.getBlogCateId());
                yield save(req.toEntity());
            }
            case "D" -> {
                if (!repository.existsById(req.getBlogCateId()))
                    throw new BusinessException("존재하지 않는 카테고리입니다: " + req.getBlogCateId());
                repository.deleteById(req.getBlogCateId());
                yield null;
            }
            default -> throw new BusinessException("올바르지 않은 _row_status: " + req.getRowStatus());
        };
    }

    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int) (Math.random() * 10000));
        return "cmc" + ts + rand;
    }
}
