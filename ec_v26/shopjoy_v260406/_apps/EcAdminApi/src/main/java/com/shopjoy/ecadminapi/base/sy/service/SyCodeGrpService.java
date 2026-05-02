package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCodeGrp;
import com.shopjoy.ecadminapi.base.sy.mapper.SyCodeGrpMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyCodeGrpRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SyCodeGrpService {


    private final SyCodeGrpMapper mapper;
    private final SyCodeGrpRepository repository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyCodeGrpDto getById(String id) {
        // sy_code_grp :: select one :: id [orm:mybatis]
        SyCodeGrpDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyCodeGrpDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_code_grp :: select list :: p [orm:mybatis]
        List<SyCodeGrpDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyCodeGrpDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_code_grp :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyCodeGrp entity) {
        // sy_code_grp :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyCodeGrp create(SyCodeGrp entity) {
        entity.setCodeGrpId(CmUtil.generateId("sy_code_grp"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_code_grp :: insert or update :: [orm:jpa]
        SyCodeGrp result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyCodeGrp save(SyCodeGrp entity) {
        if (!repository.existsById(entity.getCodeGrpId()))
            throw new CmBizException("존재하지 않는 SyCodeGrp입니다: " + entity.getCodeGrpId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_code_grp :: insert or update :: [orm:jpa]
        SyCodeGrp result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        SyCodeGrp entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<SyCodeGrp> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyCodeGrp row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setCodeGrpId(CmUtil.generateId("sy_code_grp"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                repository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getCodeGrpId(), "codeGrpId must not be null");
                SyCodeGrp entity = repository.findById(id)
                    .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "codeGrpId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                repository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getCodeGrpId(), "codeGrpId must not be null");
                if (repository.existsById(id)) repository.deleteById(id);
            }
        }
        em.flush();
    }

}
