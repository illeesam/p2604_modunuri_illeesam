package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;
import com.shopjoy.ecadminapi.base.sy.mapper.SyUserRoleMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyUserRoleRepository;
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
public class SyUserRoleService {

    private final SyUserRoleMapper syUserRoleMapper;
    private final SyUserRoleRepository syUserRoleRepository;

    @PersistenceContext
    private EntityManager em;

    /* 사용자별 역할 키조회 */
    public SyUserRoleDto.Item getById(String id) {
        SyUserRoleDto.Item dto = syUserRoleRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyUserRoleDto.Item getByIdOrNull(String id) {
        return syUserRoleRepository.selectById(id).orElse(null);
    }

    /* 사용자별 역할 상세조회 */
    public SyUserRole findById(String id) {
        return syUserRoleRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyUserRole findByIdOrNull(String id) {
        return syUserRoleRepository.findById(id).orElse(null);
    }

    /* 사용자별 역할 키검증 */
    public boolean existsById(String id) {
        return syUserRoleRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syUserRoleRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /** userId 기준 조회 — MyBatis 전용 (Repository 미적용) */
    public List<SyUserRoleDto.Item> getRolesByUserId(String userId) {
        return syUserRoleMapper.selectByUserId(userId);
    }

    /* 사용자별 역할 목록조회 */
    public List<SyUserRoleDto.Item> getList(SyUserRoleDto.Request req) {
        return syUserRoleRepository.selectList(req);
    }

    /* 사용자별 역할 페이지조회 */
    public SyUserRoleDto.PageResponse getPageData(SyUserRoleDto.Request req) {
        PageHelper.addPaging(req);
        return syUserRoleRepository.selectPageList(req);
    }

    /* 사용자별 역할 등록 */
    @Transactional
    public SyUserRole create(SyUserRole body) {
        body.setUserRoleId(CmUtil.generateId("sy_user_role"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyUserRole saved = syUserRoleRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 사용자별 역할 수정 */
    @Transactional
    public SyUserRole update(String id, SyUserRole body) {
        CmUtil.requireId(id, "id", this);
        SyUserRole entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "userRoleId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyUserRole saved = syUserRoleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 사용자별 역할 수정 */
    @Transactional
    public SyUserRole updateSelective(SyUserRole entity) {
        if (entity.getUserRoleId() == null) throw new CmBizException("userRoleId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getUserRoleId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getUserRoleId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syUserRoleRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 사용자별 역할 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyUserRole entity = findById(id);
        syUserRoleRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyUserRole save(String cmd, SyUserRole entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getUserRoleId() == null || entity.getUserRoleId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getUserRoleId() == null)
                    throw new CmBizException("삭제 대상 userRoleId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syUserRoleRepository.existsById(entity.getUserRoleId()))
                    throw new CmBizException("존재하지 않는 SyUserRole입니다: " + entity.getUserRoleId() + "::" + CmUtil.svcCallerInfo(this));
                syUserRoleRepository.deleteById(entity.getUserRoleId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setUserRoleId(CmUtil.generateId("sy_user_role"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyUserRole saved = syUserRoleRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getUserRoleId() == null)
                    throw new CmBizException("수정 대상 userRoleId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syUserRoleRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyUserRole입니다: " + entity.getUserRoleId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getUserRoleId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyUserRole> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyUserRole row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getUserRoleId() == null || row.getUserRoleId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyUserRole::getUserRoleId, "U", "userRoleId", this);
            CmUtil.requireRowIds(rows, SyUserRole::getUserRoleId, "D", "userRoleId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyUserRole::getUserRoleId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syUserRoleRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyUserRole> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyUserRole row : updateRows) {
                row.setUpdBy(authId);
                int affected = syUserRoleRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getUserRoleId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyUserRole> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyUserRole row : insertRows) {
                row.setUserRoleId(CmUtil.generateId("sy_user_role"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syUserRoleRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
