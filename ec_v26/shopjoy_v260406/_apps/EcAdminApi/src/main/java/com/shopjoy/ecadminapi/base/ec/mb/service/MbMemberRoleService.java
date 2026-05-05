package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberRoleDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberRole;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberRoleMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRoleRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
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
public class MbMemberRoleService {

    private final MbMemberRoleMapper mbMemberRoleMapper;
    private final MbMemberRoleRepository mbMemberRoleRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MbMemberRoleDto getById(String id) {
        // mb_member_role :: select one :: id [orm:mybatis]
        return mbMemberRoleMapper.selectById(id);
    }

    @Transactional(readOnly = true)
    public List<MbMemberRoleDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // mb_member_role :: select list :: p [orm:mybatis]
        return mbMemberRoleMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<MbMemberRoleDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // mb_member_role :: select page :: p [orm:mybatis]
        return PageResult.of(mbMemberRoleMapper.selectPageList(p), mbMemberRoleMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(MbMemberRole entity) {
        // mb_member_role :: update :: entity [orm:mybatis]
        return mbMemberRoleMapper.updateSelective(entity);
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public MbMemberRole create(MbMemberRole entity) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        entity.setMemberRoleId(CmUtil.generateId("mb_member_role"));
        entity.setGrantUserId(authId);
        entity.setGrantDate(now);
        entity.setRegBy(authId);
        entity.setRegDate(now);
        // mb_member_role :: insert or update :: [orm:jpa]
        return mbMemberRoleRepository.save(entity);
    }

    @Transactional
    @SuppressWarnings("null")
    public MbMemberRole save(MbMemberRole entity) {
        if (!mbMemberRoleRepository.existsById(entity.getMemberRoleId()))
            throw new CmBizException("존재하지 않는 MbMemberRole입니다: " + entity.getMemberRoleId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // mb_member_role :: insert or update :: [orm:jpa]
        return mbMemberRoleRepository.save(entity);
    }

    @Transactional
    @SuppressWarnings("null")
    public void delete(String id) {
        if (!mbMemberRoleRepository.existsById(id))
            throw new CmBizException("존재하지 않는 MbMemberRole입니다: " + id);
        // mb_member_role :: delete :: id [orm:jpa]
        mbMemberRoleRepository.deleteById(id);
    }

    @Transactional
    public void saveList(List<MbMemberRole> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (MbMemberRole row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setMemberRoleId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("mb_member_role"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                mbMemberRoleRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getMemberRoleId(), "memberRoleId must not be null");
                MbMemberRole entity = mbMemberRoleRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "memberRoleId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                mbMemberRoleRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getMemberRoleId(), "memberRoleId must not be null");
                if (mbMemberRoleRepository.existsById(id)) mbMemberRoleRepository.deleteById(id);
            }
        }
    }
}