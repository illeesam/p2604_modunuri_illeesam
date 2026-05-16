package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyDeptDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyDept;
import com.shopjoy.ecadminapi.base.sy.mapper.SyDeptMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyDeptRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyDeptService {

    private final SyDeptMapper syDeptMapper;
    private final SyDeptRepository syDeptRepository;

    @PersistenceContext
    private EntityManager em;

    /** getTree — 트리조회 (MyBatis 전용 — Repository 미적용) */
    public List<SyDeptDto.Item> getTree() {
        return syDeptMapper.selectTree();
    }

    /** getById — 단건조회 */
    public SyDeptDto.Item getById(String id) {
        SyDeptDto.Item dto = syDeptRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyDeptDto.Item getByIdOrNull(String id) {
        return syDeptRepository.selectById(id).orElse(null);
    }

    /** findById — 단건조회 (JPA) */
    public SyDept findById(String id) {
        return syDeptRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyDept findByIdOrNull(String id) {
        return syDeptRepository.findById(id).orElse(null);
    }

    /** existsById — 존재 여부 확인 */
    public boolean existsById(String id) {
        return syDeptRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syDeptRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /** getList — 목록조회 */
    public List<SyDeptDto.Item> getList(SyDeptDto.Request req) {
        return syDeptRepository.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public SyDeptDto.PageResponse getPageData(SyDeptDto.Request req) {
        PageHelper.addPaging(req);
        return syDeptRepository.selectPageList(req);
    }

    /* 부서 등록 */
    @Transactional
    public SyDept create(SyDept body) {
        body.setDeptId(CmUtil.generateId("sy_dept"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyDept saved = syDeptRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 부서 저장 */
    @Transactional
    public SyDept save(SyDept entity) {
        if (!existsById(entity.getDeptId()))
            throw new CmBizException("존재하지 않는 SyDept입니다: " + entity.getDeptId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyDept saved = syDeptRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 부서 수정 */
    @Transactional
    public SyDept update(String id, SyDept body) {
        SyDept entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "deptId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyDept saved = syDeptRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 부서 수정 */
    @Transactional
    public SyDept updateSelective(SyDept entity) {
        if (entity.getDeptId() == null) throw new CmBizException("deptId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getDeptId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDeptId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syDeptRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 부서 삭제 */
    @Transactional
    public void delete(String id) {
        SyDept entity = findById(id);
        syDeptRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 부서 목록저장 */
    @Transactional
    public void saveList(List<SyDept> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getDeptId() != null)
            .map(SyDept::getDeptId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syDeptRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyDept> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getDeptId() != null)
            .toList();
        for (SyDept row : updateRows) {
            SyDept entity = findById(row.getDeptId());
            VoUtil.voCopyExclude(row, entity, "deptId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syDeptRepository.save(entity);
        }
        em.flush();

        List<SyDept> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyDept row : insertRows) {
            row.setDeptId(CmUtil.generateId("sy_dept"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syDeptRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
