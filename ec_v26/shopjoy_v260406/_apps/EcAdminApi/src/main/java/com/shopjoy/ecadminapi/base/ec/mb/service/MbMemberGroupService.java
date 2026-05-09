package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGroupDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGroup;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberGroupMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberGroupRepository;
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
public class MbMemberGroupService {

    private final MbMemberGroupMapper mbMemberGroupMapper;
    private final MbMemberGroupRepository mbMemberGroupRepository;

    @PersistenceContext
    private EntityManager em;

    public MbMemberGroupDto.Item getById(String id) {
        MbMemberGroupDto.Item dto = mbMemberGroupMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public MbMemberGroup findById(String id) {
        return mbMemberGroupRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return mbMemberGroupRepository.existsById(id);
    }

    public List<MbMemberGroupDto.Item> getList(MbMemberGroupDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return mbMemberGroupMapper.selectList(req);
    }

    public MbMemberGroupDto.PageResponse getPageData(MbMemberGroupDto.Request req) {
        PageHelper.addPaging(req);
        MbMemberGroupDto.PageResponse res = new MbMemberGroupDto.PageResponse();
        List<MbMemberGroupDto.Item> list = mbMemberGroupMapper.selectPageList(req);
        long count = mbMemberGroupMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public MbMemberGroup create(MbMemberGroup body) {
        body.setMemberGroupId(CmUtil.generateId("mb_member_group"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbMemberGroup saved = mbMemberGroupRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbMemberGroup save(MbMemberGroup entity) {
        if (!existsById(entity.getMemberGroupId()))
            throw new CmBizException("존재하지 않는 MbMemberGroup입니다: " + entity.getMemberGroupId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberGroup saved = mbMemberGroupRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbMemberGroup update(String id, MbMemberGroup body) {
        MbMemberGroup entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "memberGroupId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberGroup saved = mbMemberGroupRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbMemberGroup updatePartial(MbMemberGroup entity) {
        if (entity.getMemberGroupId() == null) throw new CmBizException("memberGroupId 가 필요합니다.");
        if (!existsById(entity.getMemberGroupId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getMemberGroupId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbMemberGroupMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        MbMemberGroup entity = findById(id);
        mbMemberGroupRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<MbMemberGroup> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getMemberGroupId() != null)
            .map(MbMemberGroup::getMemberGroupId)
            .toList();
        if (!deleteIds.isEmpty()) {
            mbMemberGroupRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<MbMemberGroup> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getMemberGroupId() != null)
            .toList();
        for (MbMemberGroup row : updateRows) {
            MbMemberGroup entity = findById(row.getMemberGroupId());
            VoUtil.voCopyExclude(row, entity, "memberGroupId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            mbMemberGroupRepository.save(entity);
        }
        em.flush();

        List<MbMemberGroup> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (MbMemberGroup row : insertRows) {
            row.setMemberGroupId(CmUtil.generateId("mb_member_group"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            mbMemberGroupRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
