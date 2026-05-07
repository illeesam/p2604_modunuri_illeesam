package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyNoticeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNotice;
import com.shopjoy.ecadminapi.base.sy.mapper.SyNoticeMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyNoticeRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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
public class SyNoticeService {


    private final SyNoticeMapper syNoticeMapper;
    private final SyNoticeRepository syNoticeRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyNoticeDto getById(String id) {
        // sy_notice :: select one :: id [orm:mybatis]
        SyNoticeDto result = syNoticeMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<SyNoticeDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_notice :: select list :: p [orm:mybatis]
        List<SyNoticeDto> result = syNoticeMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<SyNoticeDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_notice :: select page :: p [orm:mybatis]
        return PageResult.of(syNoticeMapper.selectPageList(p), syNoticeMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyNotice entity) {
        // sy_notice :: update :: entity [orm:mybatis]
        int result = syNoticeMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyNotice create(SyNotice entity) {
        entity.setNoticeId(CmUtil.generateId("sy_notice"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_notice :: insert or update :: [orm:jpa]
        SyNotice result = syNoticeRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public SyNotice save(SyNotice entity) {
        if (!syNoticeRepository.existsById(entity.getNoticeId()))
            throw new CmBizException("존재하지 않는 SyNotice입니다: " + entity.getNoticeId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_notice :: insert or update :: [orm:jpa]
        SyNotice result = syNoticeRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyNotice entity = syNoticeRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syNoticeRepository.delete(entity);
        em.flush();
        if (syNoticeRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyNotice> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyNotice row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setNoticeId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_notice"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syNoticeRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getNoticeId(), "noticeId must not be null");
                SyNotice entity = syNoticeRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "noticeId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syNoticeRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getNoticeId(), "noticeId must not be null");
                if (syNoticeRepository.existsById(id)) syNoticeRepository.deleteById(id);
            }
        }
        em.flush();
    }
}