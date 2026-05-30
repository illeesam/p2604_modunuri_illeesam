package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleRepository;
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
public class SyRoleService {

    private final SyRoleRepository syRoleRepository;

    @PersistenceContext
    private EntityManager em;

    /* 역할(권한) 키조회 */
    public SyRoleDto.Item getById(String id) {
        SyRoleDto.Item dto = syRoleRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyRoleDto.Item getByIdOrNull(String id) {
        return syRoleRepository.selectById(id).orElse(null);
    }

    /* 역할(권한) 상세조회 */
    public SyRole findById(String id) {
        return syRoleRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyRole findByIdOrNull(String id) {
        return syRoleRepository.findById(id).orElse(null);
    }

    /* 역할(권한) 키검증 */
    public boolean existsById(String id) {
        return syRoleRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syRoleRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 역할(권한) 목록조회 */
    public List<SyRoleDto.Item> getList(SyRoleDto.Request req) {
        return syRoleRepository.selectList(req);
    }

    /* 역할(권한) 페이지조회 */
    public SyRoleDto.PageResponse getPageData(SyRoleDto.Request req) {
        PageHelper.addPaging(req);
        return syRoleRepository.selectPageList(req);
    }

    /** countList — 검색조건 기준 전체 카운트 (대량 export 시 안전 상한 검증용) */
    public long countList(SyRoleDto.Request req) {
        return syRoleRepository.selectCount(req);
    }

    /**
     * fetchChunked — 검색조건 기준 전체 결과를 chunk 단위로 fetch 하여 consumer 에 흘려보낸다.
     * <p>QueryDSL + JPA 환경에서 메모리 안전한 대용량 export 용도.
     * <p><b>안전장치</b>: req 원본 보존(snapshot 복사) + sort 미지정 시 PK 강제 정렬.
     * 각 chunk 처리 후 em.clear() 로 영속성 컨텍스트 정리.
     */
    public int fetchChunked(SyRoleDto.Request req, int chunkSize, java.util.function.Consumer<SyRoleDto.Item> consumer) {
        SyRoleDto.Request snap = new SyRoleDto.Request();
        VoUtil.voCopy(req, snap);
        snap.setPageSize(chunkSize);
        if (snap.getSort() == null || snap.getSort().isBlank()) {
            snap.setSort("roleId asc");
        }

        int pageNo = 1;
        int totalProcessed = 0;
        while (true) {
            snap.setPageNo(pageNo);
            List<SyRoleDto.Item> chunk = syRoleRepository.selectList(snap);
            if (chunk.isEmpty()) break;
            for (SyRoleDto.Item item : chunk) consumer.accept(item);
            totalProcessed += chunk.size();
            if (chunk.size() < chunkSize) break;
            pageNo++;
            em.clear();
        }
        return totalProcessed;
    }

    /* 역할(권한) 등록 */
    @Transactional
    public SyRole create(SyRole body) {
        body.setRoleId(CmUtil.generateId("sy_role"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyRole saved = syRoleRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 역할(권한) 수정 */
    @Transactional
    public SyRole update(String id, SyRole body) {
        CmUtil.requireId(id, "id", this);
        SyRole entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "roleId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyRole saved = syRoleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 역할(권한) 수정 */
    @Transactional
    public SyRole updateSelective(SyRole entity) {
        if (entity.getRoleId() == null) throw new CmBizException("roleId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getRoleId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getRoleId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syRoleRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 역할(권한) 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyRole entity = findById(id);
        syRoleRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyRole save(String cmd, SyRole entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getRoleId() == null || entity.getRoleId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getRoleId() == null)
                    throw new CmBizException("삭제 대상 roleId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syRoleRepository.existsById(entity.getRoleId()))
                    throw new CmBizException("존재하지 않는 SyRole입니다: " + entity.getRoleId() + "::" + CmUtil.svcCallerInfo(this));
                syRoleRepository.deleteById(entity.getRoleId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setRoleId(CmUtil.generateId("sy_role"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyRole saved = syRoleRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getRoleId() == null)
                    throw new CmBizException("수정 대상 roleId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syRoleRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyRole입니다: " + entity.getRoleId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getRoleId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyRole> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyRole row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getRoleId() == null || row.getRoleId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyRole::getRoleId, "U", "roleId", this);
            CmUtil.requireRowIds(rows, SyRole::getRoleId, "D", "roleId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyRole::getRoleId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syRoleRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyRole> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyRole row : updateRows) {
                row.setUpdBy(authId);
                int affected = syRoleRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getRoleId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyRole> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyRole row : insertRows) {
                row.setRoleId(CmUtil.generateId("sy_role"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syRoleRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
