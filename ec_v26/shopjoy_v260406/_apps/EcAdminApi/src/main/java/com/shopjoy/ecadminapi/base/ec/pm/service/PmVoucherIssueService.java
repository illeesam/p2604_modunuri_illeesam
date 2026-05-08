package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucherIssue;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmVoucherIssueMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmVoucherIssueRepository;
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
@Transactional(readOnly = true)
public class PmVoucherIssueService {


    private final PmVoucherIssueMapper pmVoucherIssueMapper;
    private final PmVoucherIssueRepository pmVoucherIssueRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public PmVoucherIssueDto getById(String id) {
        PmVoucherIssueDto result = pmVoucherIssueMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<PmVoucherIssueDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<PmVoucherIssueDto> result = pmVoucherIssueMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<PmVoucherIssueDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(pmVoucherIssueMapper.selectPageList(p), pmVoucherIssueMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(PmVoucherIssue entity) {
        int result = pmVoucherIssueMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmVoucherIssue create(PmVoucherIssue entity) {
        entity.setVoucherIssueId(CmUtil.generateId("pm_voucher_issue"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmVoucherIssue result = pmVoucherIssueRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public PmVoucherIssue save(PmVoucherIssue entity) {
        if (!pmVoucherIssueRepository.existsById(entity.getVoucherIssueId()))
            throw new CmBizException("존재하지 않는 PmVoucherIssue입니다: " + entity.getVoucherIssueId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmVoucherIssue result = pmVoucherIssueRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!pmVoucherIssueRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PmVoucherIssue입니다: " + id);
        pmVoucherIssueRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PmVoucherIssue> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PmVoucherIssue row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setVoucherIssueId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pm_voucher_issue"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmVoucherIssueRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getVoucherIssueId(), "voucherIssueId must not be null");
                PmVoucherIssue entity = pmVoucherIssueRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "voucherIssueId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pmVoucherIssueRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getVoucherIssueId(), "voucherIssueId must not be null");
                if (pmVoucherIssueRepository.existsById(id)) pmVoucherIssueRepository.deleteById(id);
            }
        }
    }
}