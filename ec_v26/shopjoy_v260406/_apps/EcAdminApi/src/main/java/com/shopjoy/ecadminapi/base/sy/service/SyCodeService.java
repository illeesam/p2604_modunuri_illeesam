package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import com.shopjoy.ecadminapi.base.sy.mapper.SyCodeMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyCodeRepository;
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
public class SyCodeService {


    private final SyCodeMapper syCodeMapper;
    private final SyCodeRepository syCodeRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyCodeDto getById(String id) {
        // sy_code :: select one :: id [orm:mybatis]
        SyCodeDto result = syCodeMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<SyCodeDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_code :: select list :: p [orm:mybatis]
        List<SyCodeDto> result = syCodeMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<SyCodeDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_code :: select page :: p [orm:mybatis]
        return PageResult.of(syCodeMapper.selectPageList(p), syCodeMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyCode entity) {
        // sy_code :: update :: entity [orm:mybatis]
        int result = syCodeMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyCode create(SyCode entity) {
        entity.setCodeId(CmUtil.generateId("sy_code"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_code :: insert or update :: [orm:jpa]
        SyCode result = syCodeRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public SyCode save(SyCode entity) {
        if (!syCodeRepository.existsById(entity.getCodeId()))
            throw new CmBizException("존재하지 않는 SyCode입니다: " + entity.getCodeId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_code :: insert or update :: [orm:jpa]
        SyCode result = syCodeRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyCode entity = syCodeRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syCodeRepository.delete(entity);
        em.flush();
        if (syCodeRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyCode> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyCode row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setCodeId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_code"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syCodeRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getCodeId(), "codeId must not be null");
                SyCode entity = syCodeRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "codeId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syCodeRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getCodeId(), "codeId must not be null");
                if (syCodeRepository.existsById(id)) syCodeRepository.deleteById(id);
            }
        }
        em.flush();
    }
}