package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
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

    private final MbMemberRepository mbMemberRepository;

    @PersistenceContext
    private EntityManager em;

    /* 회원 키조회 */
    public MbMemberDto.Item getById(String id) {
        MbMemberDto.Item dto = mbMemberRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbMemberDto.Item getByIdOrNull(String id) {
        return mbMemberRepository.selectById(id).orElse(null);
    }

    /* 회원 상세조회 */
    public MbMember findById(String id) {
        return mbMemberRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbMember findByIdOrNull(String id) {
        return mbMemberRepository.findById(id).orElse(null);
    }

    /* 회원 키검증 */
    public boolean existsById(String id) {
        return mbMemberRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!mbMemberRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 회원 목록조회 */
    public List<MbMemberDto.Item> getList(MbMemberDto.Request req) {
        return mbMemberRepository.selectList(req);
    }

    /* 회원 페이지조회 */
    public MbMemberDto.PageResponse getPageData(MbMemberDto.Request req) {
        PageHelper.addPaging(req);
        return mbMemberRepository.selectPageList(req);
    }

    /* 회원 등록 */
    @Transactional
    public MbMember create(MbMember body) {
        body.setMemberId(CmUtil.generateId("mb_member"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbMember saved = mbMemberRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 회원 저장 */
    @Transactional
    public MbMember save(MbMember entity) {
        if (!existsById(entity.getMemberId()))
            throw new CmBizException("존재하지 않는 MbMember입니다: " + entity.getMemberId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMember saved = mbMemberRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 회원 수정 */
    @Transactional
    public MbMember update(String id, MbMember body) {
        MbMember entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "memberId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMember saved = mbMemberRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 회원 수정 */
    @Transactional
    public MbMember updateSelective(MbMember entity) {
        if (entity.getMemberId() == null) throw new CmBizException("memberId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getMemberId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getMemberId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbMemberRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 회원 삭제 */
    @Transactional
    public void delete(String id) {
        MbMember entity = findById(id);
        mbMemberRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 회원 목록저장 */
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
