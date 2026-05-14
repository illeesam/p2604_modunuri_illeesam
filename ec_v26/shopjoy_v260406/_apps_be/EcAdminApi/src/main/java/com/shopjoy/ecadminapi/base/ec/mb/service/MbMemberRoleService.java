package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberRoleDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberRole;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRoleRepository;
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
public class MbMemberRoleService {

    private final MbMemberRoleRepository mbMemberRoleRepository;

    @PersistenceContext
    private EntityManager em;

    public MbMemberRoleDto.Item getById(String id) {
        MbMemberRoleDto.Item dto = mbMemberRoleRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbMemberRoleDto.Item getByIdOrNull(String id) {
        return mbMemberRoleRepository.selectById(id).orElse(null);
    }

    public MbMemberRole findById(String id) {
        return mbMemberRoleRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbMemberRole findByIdOrNull(String id) {
        return mbMemberRoleRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return mbMemberRoleRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!mbMemberRoleRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<MbMemberRoleDto.Item> getList(MbMemberRoleDto.Request req) {
        return mbMemberRoleRepository.selectList(req);
    }

    public MbMemberRoleDto.PageResponse getPageData(MbMemberRoleDto.Request req) {
        PageHelper.addPaging(req);
        return mbMemberRoleRepository.selectPageList(req);
    }

    @Transactional
    public MbMemberRole create(MbMemberRole body) {
        body.setMemberRoleId(CmUtil.generateId("mb_member_role"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbMemberRole saved = mbMemberRoleRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public MbMemberRole save(MbMemberRole entity) {
        if (!existsById(entity.getMemberRoleId()))
            throw new CmBizException("존재하지 않는 MbMemberRole입니다: " + entity.getMemberRoleId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberRole saved = mbMemberRoleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public MbMemberRole update(String id, MbMemberRole body) {
        MbMemberRole entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "memberRoleId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberRole saved = mbMemberRoleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public MbMemberRole updateSelective(MbMemberRole entity) {
        if (entity.getMemberRoleId() == null) throw new CmBizException("memberRoleId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getMemberRoleId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getMemberRoleId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbMemberRoleRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        MbMemberRole entity = findById(id);
        mbMemberRoleRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<MbMemberRole> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getMemberRoleId() != null)
            .map(MbMemberRole::getMemberRoleId)
            .toList();
        if (!deleteIds.isEmpty()) {
            mbMemberRoleRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<MbMemberRole> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getMemberRoleId() != null)
            .toList();
        for (MbMemberRole row : updateRows) {
            MbMemberRole entity = findById(row.getMemberRoleId());
            VoUtil.voCopyExclude(row, entity, "memberRoleId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            mbMemberRoleRepository.save(entity);
        }
        em.flush();

        List<MbMemberRole> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (MbMemberRole row : insertRows) {
            row.setMemberRoleId(CmUtil.generateId("mb_member_role"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            mbMemberRoleRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
