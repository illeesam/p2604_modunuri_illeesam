package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyContact;
import com.shopjoy.ecadminapi.base.sy.mapper.SyContactMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyContactRepository;
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
public class SyContactService {


    private final SyContactMapper syContactMapper;
    private final SyContactRepository syContactRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyContactDto getById(String id) {
        // sy_contact :: select one :: id [orm:mybatis]
        SyContactDto result = syContactMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<SyContactDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_contact :: select list :: p [orm:mybatis]
        List<SyContactDto> result = syContactMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<SyContactDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_contact :: select page :: p [orm:mybatis]
        return PageResult.of(syContactMapper.selectPageList(p), syContactMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyContact entity) {
        // sy_contact :: update :: entity [orm:mybatis]
        int result = syContactMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyContact create(SyContact entity) {
        entity.setContactId(CmUtil.generateId("sy_contact"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_contact :: insert or update :: [orm:jpa]
        SyContact result = syContactRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public SyContact save(SyContact entity) {
        if (!syContactRepository.existsById(entity.getContactId()))
            throw new CmBizException("존재하지 않는 SyContact입니다: " + entity.getContactId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_contact :: insert or update :: [orm:jpa]
        SyContact result = syContactRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyContact entity = syContactRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syContactRepository.delete(entity);
        em.flush();
        if (syContactRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyContact> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyContact row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setContactId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_contact"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syContactRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getContactId(), "contactId must not be null");
                SyContact entity = syContactRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "contactId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syContactRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getContactId(), "contactId must not be null");
                if (syContactRepository.existsById(id)) syContactRepository.deleteById(id);
            }
        }
        em.flush();
    }
}