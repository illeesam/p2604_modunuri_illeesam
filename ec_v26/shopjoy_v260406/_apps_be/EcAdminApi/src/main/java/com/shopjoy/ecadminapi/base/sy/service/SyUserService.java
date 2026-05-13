package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import com.shopjoy.ecadminapi.base.sy.repository.SyUserRepository;
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
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyUserService {

    private final SyUserRepository syUserRepository;

    @PersistenceContext
    private EntityManager em;

    // ── 조회 (MyBatis - JOIN 필드 포함) ──────────────────────────

    /** getById — 단건조회 (QueryDSL, JOIN 필드 포함된 Item) */
    public SyUserDto.Item getById(String id) {
        SyUserDto.Item dto = syUserRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    /** findById — 단건조회 (JPA, 영속성 컨텍스트 동기화된 SyUser 엔티티). 변경 메서드의 저장 후 응답에 사용. */
    public SyUser findById(String id) {
        return syUserRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    /** existsById — 존재 여부 확인 (JPA) */
    public boolean existsById(String id) {
        return syUserRepository.existsById(id);
    }

    /** getList — 목록조회 (QueryDSL Request 받아 Map 변환 후 Repository 호출 — DTO 타입 안전 + Repository missing field 안전) */
    public List<SyUserDto.Item> getList(SyUserDto.Request req) {
        return syUserRepository.selectList(req);
    }

    /** getPageData — 페이징조회 (QueryDSL Request → Repository 호출) */
    public SyUserDto.PageResponse getPageData(SyUserDto.Request req) {
        PageHelper.addPaging(req);
        return syUserRepository.selectPageList(req);
    }

    // ── 변경 (JPA - SyUser 엔티티 반환) ──────────────────────────

    /** create — 생성 */
    @Transactional
    public SyUser create(SyUser body) {
        body.setUserId(CmUtil.generateId("sy_user"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyUser saved = syUserRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    /** save — 전체 저장 (ID 존재 검증) */
    @Transactional
    public SyUser save(SyUser entity) {
        if (!syUserRepository.existsById(entity.getUserId()))
            throw new CmBizException("존재하지 않는 SyUser입니다: " + entity.getUserId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyUser saved = syUserRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    /** update — 선택 필드 수정 (JPA + VoUtil voCopyExclude) */
    @Transactional
    public SyUser update(String id, SyUser body) {
        SyUser entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "userId^loginId^loginPwdHash^regBy^regDate^lastLogin^lastLoginDate^loginFailCnt");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyUser saved = syUserRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    /** updateSelective — 선택 필드 수정 (QueryDSL selective UPDATE) */
    @Transactional
    public SyUser updateSelective(SyUser entity) {
        if (entity.getUserId() == null)
            throw new CmBizException("userId 가 필요합니다.");
        if (!syUserRepository.existsById(entity.getUserId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getUserId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syUserRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        // QueryDSL 벌크연산 후 영속성 컨텍스트 동기화
        em.clear();
        return entity;
    }

    /** delete — 삭제 (JPA) */
    @Transactional
    public void delete(String id) {
        SyUser entity = findById(id);
        syUserRepository.delete(entity);
        em.flush();
        if (syUserRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 일괄 저장 (DELETE/UPDATE/INSERT 단계별 처리). 처리된 row 들의 최신 SyUser 반환 */
    @Transactional
    public void saveList(List<SyUser> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getUserId() != null)
            .map(SyUser::getUserId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syUserRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리 + 처리된 ID 수집
        List<SyUser> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getUserId() != null)
            .toList();
        for (SyUser row : updateRows) {
            SyUser entity = findById(row.getUserId());
            VoUtil.voCopyExclude(row, entity, "userId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syUserRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리 + 처리된 ID 수집
        List<SyUser> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyUser row : insertRows) {
            row.setUserId(CmUtil.generateId("sy_user"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syUserRepository.save(row);
        }
        em.flush();
        em.clear();

        // 4단계: 처리된 row 들 최신 상태 조회 (JPA)
    }

}
