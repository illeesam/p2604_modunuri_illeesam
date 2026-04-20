package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbSnsMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbSnsMember;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbSnsMemberMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbSnsMemberRepository;
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
public class MbSnsMemberService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final MbSnsMemberMapper mapper;
    private final MbSnsMemberRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MbSnsMemberDto getById(String id) {
        MbSnsMemberDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<MbSnsMemberDto> getList(Map<String, Object> p) {
        List<MbSnsMemberDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<MbSnsMemberDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<MbSnsMemberDto> pageList = mapper.selectPageList(p);
        PageResult<MbSnsMemberDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(MbSnsMember entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public MbSnsMember create(MbSnsMember entity) {
        entity.setSnsMemId(generateId());
        entity.setRegBy(SecurityUtil.currentUserId());
        entity.setRegDate(LocalDateTime.now());
        MbSnsMember result = repository.save(entity);
        return result;
    }

    @Transactional
    public MbSnsMember save(MbSnsMember entity) {
        if (!repository.existsById(entity.getSnsMemId()))
            throw new CmBizException("존재하지 않는 MbSnsMember입니다: " + entity.getSnsMemId());
        entity.setUpdBy(SecurityUtil.currentUserId());
        entity.setUpdDate(LocalDateTime.now());
        MbSnsMember result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 MbSnsMember입니다: " + id);
        repository.deleteById(id);
    }

    /** ID 생성: prefix=SNM (mb_sns_member) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "SNM" + ts + rand;
    }
}
