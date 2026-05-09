package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;
import com.shopjoy.ecadminapi.base.sy.mapper.SyUserRoleMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyUserRoleRepository;
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
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyUserRoleService {

    private final SyUserRoleMapper syUserRoleMapper;
    private final SyUserRoleRepository syUserRoleRepository;

    @PersistenceContext
    private EntityManager em;

    public SyUserRoleDto.Item getById(String id) {
        SyUserRoleDto.Item dto = syUserRoleMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public SyUserRole findById(String id) {
        return syUserRoleRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return syUserRoleRepository.existsById(id);
    }

    public List<SyUserRoleDto.Item> getRolesByUserId(String userId) {
        return syUserRoleMapper.selectByUserId(userId);
    }

    public List<SyUserRoleDto.Item> getList(SyUserRoleDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syUserRoleMapper.selectList(req);
    }

    public SyUserRoleDto.PageResponse getPageData(SyUserRoleDto.Request req) {
        PageHelper.addPaging(req);
        SyUserRoleDto.PageResponse res = new SyUserRoleDto.PageResponse();
        List<SyUserRoleDto.Item> list = syUserRoleMapper.selectPageList(req);
        long count = syUserRoleMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public SyUserRole create(SyUserRole body) {
        body.setUserRoleId(CmUtil.generateId("sy_user_role"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyUserRole saved = syUserRoleRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getUserRoleId());
    }

    @Transactional
    public SyUserRole save(SyUserRole entity) {
        if (!existsById(entity.getUserRoleId()))
            throw new CmBizException("존재하지 않는 SyUserRole입니다: " + entity.getUserRoleId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyUserRole saved = syUserRoleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getUserRoleId());
    }

    @Transactional
    public SyUserRole update(String id, SyUserRole body) {
        SyUserRole entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "userRoleId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyUserRole saved = syUserRoleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public SyUserRole updatePartial(SyUserRole entity) {
        if (entity.getUserRoleId() == null) throw new CmBizException("userRoleId 가 필요합니다.");
        if (!existsById(entity.getUserRoleId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getUserRoleId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syUserRoleMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getUserRoleId());
    }

    @Transactional
    public void delete(String id) {
        SyUserRole entity = findById(id);
        syUserRoleRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<SyUserRole> saveList(List<SyUserRole> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getUserRoleId() != null)
            .map(SyUserRole::getUserRoleId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syUserRoleRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<SyUserRole> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getUserRoleId() != null)
            .toList();
        for (SyUserRole row : updateRows) {
            SyUserRole entity = findById(row.getUserRoleId());
            VoUtil.voCopyExclude(row, entity, "userRoleId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syUserRoleRepository.save(entity);
            upsertedIds.add(entity.getUserRoleId());
        }
        em.flush();

        List<SyUserRole> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyUserRole row : insertRows) {
            row.setUserRoleId(CmUtil.generateId("sy_user_role"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syUserRoleRepository.save(row);
            upsertedIds.add(row.getUserRoleId());
        }
        em.flush();
        em.clear();

        List<SyUserRole> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
