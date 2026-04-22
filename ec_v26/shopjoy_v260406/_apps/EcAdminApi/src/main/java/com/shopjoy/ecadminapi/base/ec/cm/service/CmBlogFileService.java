package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogFileDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogFile;
import com.shopjoy.ecadminapi.base.ec.cm.data.vo.CmBlogFileReq;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBlogFileMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogFileRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CmBlogFileService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final CmBlogFileMapper mapper;
    private final CmBlogFileRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmBlogFileDto getById(String id) {
        return mapper.selectById(id);
    }

    @Transactional(readOnly = true)
    public List<CmBlogFileDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<CmBlogFileDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(CmBlogFile entity) {
        return mapper.updateSelective(entity);
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public CmBlogFile create(CmBlogFile entity) {
        entity.setBlogImgId(generateId());
        entity.setRegBy(SecurityUtil.getUserId());
        entity.setRegDate(LocalDateTime.now());
        return repository.save(entity);
    }

    @Transactional
    public CmBlogFile save(CmBlogFile entity) {
        CmBlogFile existing = repository.findById(entity.getBlogImgId())
                .orElseThrow(() -> new CmBizException("존재하지 않는 파일입니다: " + entity.getBlogImgId()));
        entity.setRegBy(existing.getRegBy());
        entity.setRegDate(existing.getRegDate());
        entity.setUpdBy(SecurityUtil.getUserId());
        entity.setUpdDate(LocalDateTime.now());
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 파일입니다: " + id);
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

    /** ID 생성: prefix=BLF (cm_blog_file: BL(blog) + F(file)) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int) (Math.random() * 10000));
        return "BLF" + ts + rand;
    }
}
