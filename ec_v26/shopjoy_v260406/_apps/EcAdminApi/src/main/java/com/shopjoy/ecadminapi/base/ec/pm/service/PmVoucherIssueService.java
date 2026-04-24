package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucherIssue;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmVoucherIssueMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmVoucherIssueRepository;
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
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class PmVoucherIssueService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final PmVoucherIssueMapper mapper;
    private final PmVoucherIssueRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmVoucherIssueDto getById(String id) {
        PmVoucherIssueDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PmVoucherIssueDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<PmVoucherIssueDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PmVoucherIssueDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PmVoucherIssue entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmVoucherIssue create(PmVoucherIssue entity) {
        entity.setVoucherIssueId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        PmVoucherIssue result = repository.save(entity);
        return result;
    }

    @Transactional
    public PmVoucherIssue save(PmVoucherIssue entity) {
        if (!repository.existsById(entity.getVoucherIssueId()))
            throw new CmBizException("존재하지 않는 PmVoucherIssue입니다: " + entity.getVoucherIssueId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmVoucherIssue result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PmVoucherIssue입니다: " + id);
        repository.deleteById(id);
    }

    /** ID 생성: prefix=VOI (pm_voucher_issue) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "VOI" + ts + rand;
    }
}
