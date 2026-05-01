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

@Service
@RequiredArgsConstructor
public class MbMemberRoleService {

    private final MbMemberRoleMapper mapper;
    private final MbMemberRoleRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MbMemberRoleDto getById(String id) {
        // mb_member_role :: select one :: id [orm:mybatis]
        return mapper.selectById(id);
    }

    @Transactional(readOnly = true)
    public List<MbMemberRoleDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // mb_member_role :: select list :: p [orm:mybatis]
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<MbMemberRoleDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // mb_member_role :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(MbMemberRole entity) {
        // mb_member_role :: update :: entity [orm:mybatis]
        return mapper.updateSelective(entity);
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
        return repository.save(entity);
    }

    @Transactional
    @SuppressWarnings("null")
    public MbMemberRole save(MbMemberRole entity) {
        if (!repository.existsById(entity.getMemberRoleId()))
            throw new CmBizException("존재하지 않는 MbMemberRole입니다: " + entity.getMemberRoleId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // mb_member_role :: insert or update :: [orm:jpa]
        return repository.save(entity);
    }

    @Transactional
    @SuppressWarnings("null")
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 MbMemberRole입니다: " + id);
        // mb_member_role :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
