package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
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
public class MbMemberService {

    private final MbMemberMapper mbMemberMapper;
    private final MbMemberRepository mbMemberRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MbMemberDto getById(String id) {
        MbMemberDto result = mbMemberMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<MbMemberDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<MbMemberDto> result = mbMemberMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<MbMemberDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mbMemberMapper.selectPageList(p), mbMemberMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(MbMember entity) {
        int result = mbMemberMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public MbMember create(MbMember entity) {
        entity.setMemberId(CmUtil.generateId("mb_member"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMember result = mbMemberRepository.save(entity);
        return result;
    }

    @Transactional
    public MbMember save(MbMember entity) {
        if (!mbMemberRepository.existsById(entity.getMemberId()))
            throw new CmBizException("존재하지 않는 MbMember입니다: " + entity.getMemberId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMember result = mbMemberRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!mbMemberRepository.existsById(id))
            throw new CmBizException("존재하지 않는 MbMember입니다: " + id);
        mbMemberRepository.deleteById(id);
    }

    @Transactional
    public void saveList(List<MbMember> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (MbMember row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setMemberId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("mb_member"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                mbMemberRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getMemberId(), "memberId must not be null");
                MbMember entity = mbMemberRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "memberId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                mbMemberRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getMemberId(), "memberId must not be null");
                if (mbMemberRepository.existsById(id)) mbMemberRepository.deleteById(id);
            }
        }
    }
}