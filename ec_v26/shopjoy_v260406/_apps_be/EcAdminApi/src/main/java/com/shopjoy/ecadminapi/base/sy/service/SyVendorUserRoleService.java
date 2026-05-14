package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUserRole;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorUserRoleRepository;
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
public class SyVendorUserRoleService {

    private final SyVendorUserRoleRepository syVendorUserRoleRepository;

    @PersistenceContext
    private EntityManager em;

    public SyVendorUserRoleDto.Item getById(String id) {
        SyVendorUserRoleDto.Item dto = syVendorUserRoleRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyVendorUserRoleDto.Item getByIdOrNull(String id) {
        return syVendorUserRoleRepository.selectById(id).orElse(null);
    }

    public SyVendorUserRole findById(String id) {
        return syVendorUserRoleRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyVendorUserRole findByIdOrNull(String id) {
        return syVendorUserRoleRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return syVendorUserRoleRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syVendorUserRoleRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<SyVendorUserRoleDto.Item> getList(SyVendorUserRoleDto.Request req) {
        return syVendorUserRoleRepository.selectList(req);
    }

    public SyVendorUserRoleDto.PageResponse getPageData(SyVendorUserRoleDto.Request req) {
        PageHelper.addPaging(req);
        return syVendorUserRoleRepository.selectPageList(req);
    }

    @Transactional
    public SyVendorUserRole create(SyVendorUserRole body) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        body.setVendorUserRoleId(CmUtil.generateId("sy_vendor_user_role"));
        body.setGrantUserId(authId);
        body.setGrantDate(now);
        body.setRegBy(authId);
        body.setRegDate(now);
        SyVendorUserRole saved = syVendorUserRoleRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public SyVendorUserRole save(SyVendorUserRole entity) {
        if (!existsById(entity.getVendorUserRoleId()))
            throw new CmBizException("존재하지 않는 SyVendorUserRole입니다: " + entity.getVendorUserRoleId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyVendorUserRole saved = syVendorUserRoleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public SyVendorUserRole update(String id, SyVendorUserRole body) {
        SyVendorUserRole entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "vendorUserRoleId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyVendorUserRole saved = syVendorUserRoleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public SyVendorUserRole updateSelective(SyVendorUserRole entity) {
        if (entity.getVendorUserRoleId() == null) throw new CmBizException("vendorUserRoleId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getVendorUserRoleId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getVendorUserRoleId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syVendorUserRoleRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        SyVendorUserRole entity = findById(id);
        syVendorUserRoleRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<SyVendorUserRole> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getVendorUserRoleId() != null)
            .map(SyVendorUserRole::getVendorUserRoleId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syVendorUserRoleRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyVendorUserRole> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getVendorUserRoleId() != null)
            .toList();
        for (SyVendorUserRole row : updateRows) {
            SyVendorUserRole entity = findById(row.getVendorUserRoleId());
            VoUtil.voCopyExclude(row, entity, "vendorUserRoleId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syVendorUserRoleRepository.save(entity);
        }
        em.flush();

        List<SyVendorUserRole> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyVendorUserRole row : insertRows) {
            row.setVendorUserRoleId(CmUtil.generateId("sy_vendor_user_role"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syVendorUserRoleRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
