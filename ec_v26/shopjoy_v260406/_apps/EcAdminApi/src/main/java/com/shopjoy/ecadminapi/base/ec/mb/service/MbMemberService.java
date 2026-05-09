package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
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
public class MbMemberService {

    private final MbMemberMapper mbMemberMapper;
    private final MbMemberRepository mbMemberRepository;

    @PersistenceContext
    private EntityManager em;

    public MbMemberDto.Item getById(String id) {
        MbMemberDto.Item dto = mbMemberMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public MbMember findById(String id) {
        return mbMemberRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return mbMemberRepository.existsById(id);
    }

    public List<MbMemberDto.Item> getList(MbMemberDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return mbMemberMapper.selectList(req);
    }

    public MbMemberDto.PageResponse getPageData(MbMemberDto.Request req) {
        PageHelper.addPaging(req);
        MbMemberDto.PageResponse res = new MbMemberDto.PageResponse();
        List<MbMemberDto.Item> list = mbMemberMapper.selectPageList(req);
        long count = mbMemberMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public MbMember create(MbMember body) {
        body.setMemberId(CmUtil.generateId("mb_member"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbMember saved = mbMemberRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbMember save(MbMember entity) {
        if (!existsById(entity.getMemberId()))
            throw new CmBizException("존재하지 않는 MbMember입니다: " + entity.getMemberId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMember saved = mbMemberRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbMember update(String id, MbMember body) {
        MbMember entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "memberId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMember saved = mbMemberRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbMember updatePartial(MbMember entity) {
        if (entity.getMemberId() == null) throw new CmBizException("memberId 가 필요합니다.");
        if (!existsById(entity.getMemberId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getMemberId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbMemberMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        MbMember entity = findById(id);
        mbMemberRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<MbMember> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getMemberId() != null)
            .map(MbMember::getMemberId)
            .toList();
        if (!deleteIds.isEmpty()) {
            mbMemberRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<MbMember> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getMemberId() != null)
            .toList();
        for (MbMember row : updateRows) {
            MbMember entity = findById(row.getMemberId());
            VoUtil.voCopyExclude(row, entity, "memberId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            mbMemberRepository.save(entity);
        }
        em.flush();

        List<MbMember> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (MbMember row : insertRows) {
            row.setMemberId(CmUtil.generateId("mb_member"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            mbMemberRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
