package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRoleMenu;
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleMenuRepository;
import com.shopjoy.ecadminapi.cache.redisstore.SyRoleMenuRedisStore;
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
public class SyRoleMenuService {

    private final SyRoleMenuRepository syRoleMenuRepository;
    private final SyRoleMenuRedisStore roleMenuCache;

    @PersistenceContext
    private EntityManager em;

    /* 역할별 메뉴 권한 키조회 */
    public SyRoleMenuDto.Item getById(String id) {
        SyRoleMenuDto.Item dto = syRoleMenuRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyRoleMenuDto.Item getByIdOrNull(String id) {
        return syRoleMenuRepository.selectById(id).orElse(null);
    }

    /* 역할별 메뉴 권한 상세조회 */
    public SyRoleMenu findById(String id) {
        return syRoleMenuRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyRoleMenu findByIdOrNull(String id) {
        return syRoleMenuRepository.findById(id).orElse(null);
    }

    /* 역할별 메뉴 권한 키검증 */
    public boolean existsById(String id) {
        return syRoleMenuRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syRoleMenuRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 역할별 메뉴 권한 목록조회 */
    public List<SyRoleMenuDto.Item> getList(SyRoleMenuDto.Request req) {
        return syRoleMenuRepository.selectList(req);
    }

    /* 역할별 메뉴 권한 페이지조회 */
    public SyRoleMenuDto.PageResponse getPageData(SyRoleMenuDto.Request req) {
        PageHelper.addPaging(req);
        return syRoleMenuRepository.selectPageData(req);
    }

    /* 역할별 메뉴 권한 등록 */
    @Transactional
    public SyRoleMenu create(SyRoleMenu body) {
        body.setRoleMenuId(CmUtil.generateId("sy_role_menu"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyRoleMenu saved = syRoleMenuRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        roleMenuCache.evict(body.getRoleId());
        return saved;
    }

    

    /* 역할별 메뉴 권한 수정 */
    @Transactional
    public SyRoleMenu update(String id, SyRoleMenu body) {
        CmUtil.requireId(id, "id", this);
        SyRoleMenu entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "roleMenuId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyRoleMenu saved = syRoleMenuRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        roleMenuCache.evict(entity.getRoleId());
        return saved;
    }

    /* 역할별 메뉴 권한 수정 */
    @Transactional
    public SyRoleMenu updateSelective(SyRoleMenu entity) {
        if (entity.getRoleMenuId() == null) throw new CmBizException("roleMenuId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getRoleMenuId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getRoleMenuId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syRoleMenuRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        if (entity.getRoleId() != null) roleMenuCache.evict(entity.getRoleId());
        return entity;
    }

    /* 역할별 메뉴 권한 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyRoleMenu entity = findById(id);
        String roleId = entity.getRoleId();
        syRoleMenuRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        if (roleId != null) roleMenuCache.evict(roleId);
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyRoleMenu save(String cmd, SyRoleMenu entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getRoleMenuId() == null || entity.getRoleMenuId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getRoleMenuId() == null)
                    throw new CmBizException("삭제 대상 roleMenuId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syRoleMenuRepository.existsById(entity.getRoleMenuId()))
                    throw new CmBizException("존재하지 않는 SyRoleMenu입니다: " + entity.getRoleMenuId() + "::" + CmUtil.svcCallerInfo(this));
                syRoleMenuRepository.deleteById(entity.getRoleMenuId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setRoleMenuId(CmUtil.generateId("sy_role_menu"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyRoleMenu saved = syRoleMenuRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getRoleMenuId() == null)
                    throw new CmBizException("수정 대상 roleMenuId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syRoleMenuRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyRoleMenu입니다: " + entity.getRoleMenuId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getRoleMenuId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyRoleMenu> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyRoleMenu row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getRoleMenuId() == null || row.getRoleMenuId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyRoleMenu::getRoleMenuId, "U", "roleMenuId", this);
            CmUtil.requireRowIds(rows, SyRoleMenu::getRoleMenuId, "D", "roleMenuId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyRoleMenu::getRoleMenuId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syRoleMenuRepository.deleteAllById(deleteIds);
                /* DELETE 를 DB 에 즉시 반영하여 동일 트랜잭션 내 INSERT 시 unique 충돌 회피 */
                em.flush();
                em.clear();
            }

            // 2단계: UPDATE - updateSelective
            List<SyRoleMenu> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyRoleMenu row : updateRows) {
                row.setUpdBy(authId);
                int affected = syRoleMenuRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getRoleMenuId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyRoleMenu> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyRoleMenu row : insertRows) {
                row.setRoleMenuId(CmUtil.generateId("sy_role_menu"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syRoleMenuRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
