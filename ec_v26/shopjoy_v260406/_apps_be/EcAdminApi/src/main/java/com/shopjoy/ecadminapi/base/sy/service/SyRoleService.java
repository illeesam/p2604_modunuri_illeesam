package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleRepository;
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
public class SyRoleService {

    private final SyRoleRepository syRoleRepository;

    @PersistenceContext
    private EntityManager em;

    public SyRoleDto.Item getById(String id) {
        SyRoleDto.Item dto = syRoleRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyRoleDto.Item getByIdOrNull(String id) {
        return syRoleRepository.selectById(id).orElse(null);
    }

    public SyRole findById(String id) {
        return syRoleRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyRole findByIdOrNull(String id) {
        return syRoleRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return syRoleRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syRoleRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<SyRoleDto.Item> getList(SyRoleDto.Request req) {
        return syRoleRepository.selectList(req);
    }

    public SyRoleDto.PageResponse getPageData(SyRoleDto.Request req) {
        PageHelper.addPaging(req);
        return syRoleRepository.selectPageList(req);
    }

    @Transactional
    public SyRole create(SyRole body) {
        body.setRoleId(CmUtil.generateId("sy_role"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyRole saved = syRoleRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public SyRole save(SyRole entity) {
        if (!existsById(entity.getRoleId()))
            throw new CmBizException("존재하지 않는 SyRole입니다: " + entity.getRoleId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyRole saved = syRoleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public SyRole update(String id, SyRole body) {
        SyRole entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "roleId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyRole saved = syRoleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public SyRole updateSelective(SyRole entity) {
        if (entity.getRoleId() == null) throw new CmBizException("roleId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getRoleId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getRoleId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syRoleRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        SyRole entity = findById(id);
        syRoleRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<SyRole> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getRoleId() != null)
            .map(SyRole::getRoleId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syRoleRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyRole> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getRoleId() != null)
            .toList();
        for (SyRole row : updateRows) {
            SyRole entity = findById(row.getRoleId());
            VoUtil.voCopyExclude(row, entity, "roleId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syRoleRepository.save(entity);
        }
        em.flush();

        List<SyRole> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyRole row : insertRows) {
            row.setRoleId(CmUtil.generateId("sy_role"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syRoleRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
