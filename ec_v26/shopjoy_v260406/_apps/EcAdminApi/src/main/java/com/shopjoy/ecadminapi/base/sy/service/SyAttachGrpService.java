package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttachGrp;
import com.shopjoy.ecadminapi.base.sy.mapper.SyAttachGrpMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyAttachGrpRepository;
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
@Transactional(readOnly = true)
public class SyAttachGrpService {


    private final SyAttachGrpMapper syAttachGrpMapper;
    private final SyAttachGrpRepository syAttachGrpRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public SyAttachGrpDto getById(String id) {
        // sy_attach_grp :: select one :: id [orm:mybatis]
        SyAttachGrpDto result = syAttachGrpMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<SyAttachGrpDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_attach_grp :: select list :: p [orm:mybatis]
        List<SyAttachGrpDto> result = syAttachGrpMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<SyAttachGrpDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_attach_grp :: select page :: p [orm:mybatis]
        return PageResult.of(syAttachGrpMapper.selectPageList(p), syAttachGrpMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyAttachGrp entity) {
        // sy_attach_grp :: update :: entity [orm:mybatis]
        int result = syAttachGrpMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyAttachGrp create(SyAttachGrp entity) {
        entity.setAttachGrpId(CmUtil.generateId("sy_attach_grp"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_attach_grp :: insert or update :: [orm:jpa]
        SyAttachGrp result = syAttachGrpRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public SyAttachGrp save(SyAttachGrp entity) {
        if (!syAttachGrpRepository.existsById(entity.getAttachGrpId()))
            throw new CmBizException("존재하지 않는 SyAttachGrp입니다: " + entity.getAttachGrpId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_attach_grp :: insert or update :: [orm:jpa]
        SyAttachGrp result = syAttachGrpRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyAttachGrp entity = syAttachGrpRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syAttachGrpRepository.delete(entity);
        em.flush();
        if (syAttachGrpRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyAttachGrp> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyAttachGrp row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setAttachGrpId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_attach_grp"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syAttachGrpRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getAttachGrpId(), "attachGrpId must not be null");
                SyAttachGrp entity = syAttachGrpRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "attachGrpId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syAttachGrpRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getAttachGrpId(), "attachGrpId must not be null");
                if (syAttachGrpRepository.existsById(id)) syAttachGrpRepository.deleteById(id);
            }
        }
        em.flush();
    }
}