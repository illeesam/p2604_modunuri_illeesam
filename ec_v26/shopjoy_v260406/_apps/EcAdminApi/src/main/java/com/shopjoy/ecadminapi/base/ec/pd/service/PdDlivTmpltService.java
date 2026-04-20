package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdDlivTmpltDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdDlivTmplt;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdDlivTmpltMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdDlivTmpltRepository;
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
public class PdDlivTmpltService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final PdDlivTmpltMapper mapper;
    private final PdDlivTmpltRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdDlivTmpltDto getById(String id) {
        PdDlivTmpltDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdDlivTmpltDto> getList(Map<String, Object> p) {
        List<PdDlivTmpltDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdDlivTmpltDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<PdDlivTmpltDto> pageList = mapper.selectPageList(p);
        PageResult<PdDlivTmpltDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(PdDlivTmplt entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdDlivTmplt create(PdDlivTmplt entity) {
        entity.setDlivTmpltId(generateId());
        entity.setRegBy(SecurityUtil.currentUserId());
        entity.setRegDate(LocalDateTime.now());
        PdDlivTmplt result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdDlivTmplt save(PdDlivTmplt entity) {
        if (!repository.existsById(entity.getDlivTmpltId()))
            throw new CmBizException("존재하지 않는 PdDlivTmplt입니다: " + entity.getDlivTmpltId());
        entity.setUpdBy(SecurityUtil.currentUserId());
        entity.setUpdDate(LocalDateTime.now());
        PdDlivTmplt result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdDlivTmplt입니다: " + id);
        repository.deleteById(id);
    }

    /** ID 생성: prefix=DLT (pd_dliv_tmplt) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "DLT" + ts + rand;
    }
}
