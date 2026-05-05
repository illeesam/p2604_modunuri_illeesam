package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGroupDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGroup;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberGroupMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberGroupRepository;
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
public class MbMemberGroupService {

    private final MbMemberGroupMapper mbMemberGroupMapper;
    private final MbMemberGroupRepository mbMemberGroupRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MbMemberGroupDto getById(String id) {
        MbMemberGroupDto result = mbMemberGroupMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<MbMemberGroupDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<MbMemberGroupDto> result = mbMemberGroupMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<MbMemberGroupDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mbMemberGroupMapper.selectPageList(p), mbMemberGroupMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(MbMemberGroup entity) {
        int result = mbMemberGroupMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public MbMemberGroup create(MbMemberGroup entity) {
        entity.setMemberGroupId(CmUtil.generateId("mb_member_group"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberGroup result = mbMemberGroupRepository.save(entity);
        return result;
    }

    @Transactional
    public MbMemberGroup save(MbMemberGroup entity) {
        if (!mbMemberGroupRepository.existsById(entity.getMemberGroupId()))
            throw new CmBizException("존재하지 않는 MbMemberGroup입니다: " + entity.getMemberGroupId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberGroup result = mbMemberGroupRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!mbMemberGroupRepository.existsById(id))
            throw new CmBizException("존재하지 않는 MbMemberGroup입니다: " + id);
        mbMemberGroupRepository.deleteById(id);
    }

    @Transactional
    public void saveList(List<MbMemberGroup> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (MbMemberGroup row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setMemberGroupId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("mb_member_group"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                mbMemberGroupRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getMemberGroupId(), "memberGroupId must not be null");
                MbMemberGroup entity = mbMemberGroupRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "memberGroupId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                mbMemberGroupRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getMemberGroupId(), "memberGroupId must not be null");
                if (mbMemberGroupRepository.existsById(id)) mbMemberGroupRepository.deleteById(id);
            }
        }
    }
}