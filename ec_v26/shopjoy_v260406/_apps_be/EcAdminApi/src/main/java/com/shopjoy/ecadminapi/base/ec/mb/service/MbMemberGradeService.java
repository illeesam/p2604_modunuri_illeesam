package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberGradeRepository;
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
public class MbMemberGradeService {

    private final MbMemberGradeRepository mbMemberGradeRepository;

    @PersistenceContext
    private EntityManager em;

    /* 회원 등급 키조회 */
    public MbMemberGradeDto.Item getById(String id) {
        MbMemberGradeDto.Item dto = mbMemberGradeRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbMemberGradeDto.Item getByIdOrNull(String id) {
        return mbMemberGradeRepository.selectById(id).orElse(null);
    }

    /* 회원 등급 상세조회 */
    public MbMemberGrade findById(String id) {
        return mbMemberGradeRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbMemberGrade findByIdOrNull(String id) {
        return mbMemberGradeRepository.findById(id).orElse(null);
    }

    /* 회원 등급 키검증 */
    public boolean existsById(String id) {
        return mbMemberGradeRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!mbMemberGradeRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 회원 등급 목록조회 */
    public List<MbMemberGradeDto.Item> getList(MbMemberGradeDto.Request req) {
        return mbMemberGradeRepository.selectList(req);
    }

    /* 회원 등급 페이지조회 */
    public MbMemberGradeDto.PageResponse getPageData(MbMemberGradeDto.Request req) {
        PageHelper.addPaging(req);
        return mbMemberGradeRepository.selectPageList(req);
    }

    /* 회원 등급 등록 */
    @Transactional
    public MbMemberGrade create(MbMemberGrade body) {
        body.setMemberGradeId(CmUtil.generateId("mb_member_grade"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbMemberGrade saved = mbMemberGradeRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 회원 등급 저장 */
    @Transactional
    public MbMemberGrade save(MbMemberGrade entity) {
        if (!existsById(entity.getMemberGradeId()))
            throw new CmBizException("존재하지 않는 MbMemberGrade입니다: " + entity.getMemberGradeId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberGrade saved = mbMemberGradeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 회원 등급 수정 */
    @Transactional
    public MbMemberGrade update(String id, MbMemberGrade body) {
        MbMemberGrade entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "memberGradeId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberGrade saved = mbMemberGradeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 회원 등급 수정 */
    @Transactional
    public MbMemberGrade updateSelective(MbMemberGrade entity) {
        if (entity.getMemberGradeId() == null) throw new CmBizException("memberGradeId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getMemberGradeId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getMemberGradeId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbMemberGradeRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 회원 등급 삭제 */
    @Transactional
    public void delete(String id) {
        MbMemberGrade entity = findById(id);
        mbMemberGradeRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 회원 등급 목록저장 */
    @Transactional
    public void saveList(List<MbMemberGrade> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getMemberGradeId() != null)
            .map(MbMemberGrade::getMemberGradeId)
            .toList();
        if (!deleteIds.isEmpty()) {
            mbMemberGradeRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<MbMemberGrade> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getMemberGradeId() != null)
            .toList();
        for (MbMemberGrade row : updateRows) {
            MbMemberGrade entity = findById(row.getMemberGradeId());
            VoUtil.voCopyExclude(row, entity, "memberGradeId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            mbMemberGradeRepository.save(entity);
        }
        em.flush();

        List<MbMemberGrade> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (MbMemberGrade row : insertRows) {
            row.setMemberGradeId(CmUtil.generateId("mb_member_grade"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            mbMemberGradeRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
