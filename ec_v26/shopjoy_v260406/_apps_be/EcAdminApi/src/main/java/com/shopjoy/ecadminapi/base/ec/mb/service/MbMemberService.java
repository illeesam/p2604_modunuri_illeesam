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
        return mbMemberRepository.selectPageData(req);
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

    

    /* 회원 수정 */
    @Transactional
    public MbMember update(String id, MbMember body) {
        CmUtil.requireId(id, "id", this);
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
        CmUtil.requireId(id, "id", this);
        MbMember entity = findById(id);
        mbMemberRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public MbMember saveOneBase(MbMember entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getMemberId() == null || entity.getMemberId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getMemberId() == null)
                throw new CmBizException("삭제 대상 memberId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!mbMemberRepository.existsById(entity.getMemberId()))
                throw new CmBizException("존재하지 않는 MbMember입니다: " + entity.getMemberId() + "::" + CmUtil.svcCallerInfo(this));
            mbMemberRepository.deleteById(entity.getMemberId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setMemberId(CmUtil.generateId("mb_member"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            MbMember saved = mbMemberRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getMemberId() == null)
                throw new CmBizException("수정 대상 memberId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = mbMemberRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 MbMember입니다: " + entity.getMemberId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getMemberId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<MbMember> rows) {
        /* 0단계: rowStatus 정규화 */
        for (MbMember row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getMemberId() == null || row.getMemberId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, MbMember::getMemberId, "U", "memberId", this);
        CmUtil.requireRowIds(rows, MbMember::getMemberId, "D", "memberId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(MbMember::getMemberId)
            .toList();
        if (!deleteIds.isEmpty()) {
            mbMemberRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<MbMember> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (MbMember row : updateRows) {
            row.setUpdBy(authId);
            int affected = mbMemberRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getMemberId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<MbMember> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (MbMember row : insertRows) {
            row.setMemberId(CmUtil.generateId("mb_member"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            mbMemberRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
