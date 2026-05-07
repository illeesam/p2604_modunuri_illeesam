package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.base.sy.mapper.SyAttachMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyAttachRepository;
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
public class SyAttachService {


    private final SyAttachMapper syAttachMapper;
    private final SyAttachRepository syAttachRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyAttachDto getById(String id) {
        // sy_attach :: select one :: id [orm:mybatis]
        SyAttachDto result = syAttachMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<SyAttachDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_attach :: select list :: p [orm:mybatis]
        List<SyAttachDto> result = syAttachMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<SyAttachDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_attach :: select page :: p [orm:mybatis]
        return PageResult.of(syAttachMapper.selectPageList(p), syAttachMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyAttach entity) {
        // sy_attach :: update :: entity [orm:mybatis]
        int result = syAttachMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyAttach create(SyAttach entity) {
        entity.setAttachId(CmUtil.generateId("sy_attach"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_attach :: insert or update :: [orm:jpa]
        SyAttach result = syAttachRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public SyAttach save(SyAttach entity) {
        if (!syAttachRepository.existsById(entity.getAttachId()))
            throw new CmBizException("존재하지 않는 SyAttach입니다: " + entity.getAttachId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_attach :: insert or update :: [orm:jpa]
        SyAttach result = syAttachRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyAttach entity = syAttachRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syAttachRepository.delete(entity);
        em.flush();
        if (syAttachRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyAttach> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyAttach row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setAttachId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_attach"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syAttachRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getAttachId(), "attachId must not be null");
                SyAttach entity = syAttachRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "attachId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syAttachRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getAttachId(), "attachId must not be null");
                if (syAttachRepository.existsById(id)) syAttachRepository.deleteById(id);
            }
        }
        em.flush();
    }
}