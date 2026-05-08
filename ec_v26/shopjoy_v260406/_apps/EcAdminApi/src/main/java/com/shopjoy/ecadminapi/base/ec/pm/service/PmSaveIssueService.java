package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveIssue;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmSaveIssueMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmSaveIssueRepository;
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
public class PmSaveIssueService {


    private final PmSaveIssueMapper pmSaveIssueMapper;
    private final PmSaveIssueRepository pmSaveIssueRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public PmSaveIssueDto getById(String id) {
        PmSaveIssueDto result = pmSaveIssueMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<PmSaveIssueDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<PmSaveIssueDto> result = pmSaveIssueMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<PmSaveIssueDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(pmSaveIssueMapper.selectPageList(p), pmSaveIssueMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(PmSaveIssue entity) {
        int result = pmSaveIssueMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmSaveIssue create(PmSaveIssue entity) {
        entity.setSaveIssueId(CmUtil.generateId("pm_save_issue"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSaveIssue result = pmSaveIssueRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public PmSaveIssue save(PmSaveIssue entity) {
        if (!pmSaveIssueRepository.existsById(entity.getSaveIssueId()))
            throw new CmBizException("존재하지 않는 PmSaveIssue입니다: " + entity.getSaveIssueId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSaveIssue result = pmSaveIssueRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!pmSaveIssueRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PmSaveIssue입니다: " + id);
        pmSaveIssueRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PmSaveIssue> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PmSaveIssue row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setSaveIssueId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pm_save_issue"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmSaveIssueRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getSaveIssueId(), "saveIssueId must not be null");
                PmSaveIssue entity = pmSaveIssueRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "saveIssueId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pmSaveIssueRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getSaveIssueId(), "saveIssueId must not be null");
                if (pmSaveIssueRepository.existsById(id)) pmSaveIssueRepository.deleteById(id);
            }
        }
    }
}