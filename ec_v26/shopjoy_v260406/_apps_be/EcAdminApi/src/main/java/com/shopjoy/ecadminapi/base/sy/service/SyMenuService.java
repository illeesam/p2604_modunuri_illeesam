package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import com.shopjoy.ecadminapi.base.sy.repository.SyMenuRepository;
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
public class SyMenuService {

    private final SyMenuRepository syMenuRepository;

    @PersistenceContext
    private EntityManager em;

    /* 메뉴 키조회 */
    public SyMenuDto.Item getById(String id) {
        SyMenuDto.Item dto = syMenuRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyMenuDto.Item getByIdOrNull(String id) {
        return syMenuRepository.selectById(id).orElse(null);
    }

    /* 메뉴 상세조회 */
    public SyMenu findById(String id) {
        return syMenuRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyMenu findByIdOrNull(String id) {
        return syMenuRepository.findById(id).orElse(null);
    }

    /* 메뉴 키검증 */
    public boolean existsById(String id) {
        return syMenuRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syMenuRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 메뉴 목록조회 */
    public List<SyMenuDto.Item> getList(SyMenuDto.Request req) {
        return syMenuRepository.selectList(req);
    }

    /* 메뉴 페이지조회 */
    public SyMenuDto.PageResponse getPageData(SyMenuDto.Request req) {
        PageHelper.addPaging(req);
        return syMenuRepository.selectPageList(req);
    }

    /* 메뉴 등록 */
    @Transactional
    public SyMenu create(SyMenu body) {
        body.setMenuId(CmUtil.generateId("sy_menu"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyMenu saved = syMenuRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 메뉴 수정 */
    @Transactional
    public SyMenu update(String id, SyMenu body) {
        CmUtil.requireId(id, "id", this);
        SyMenu entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "menuId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyMenu saved = syMenuRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 메뉴 수정 */
    @Transactional
    public SyMenu updateSelective(SyMenu entity) {
        if (entity.getMenuId() == null) throw new CmBizException("menuId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getMenuId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getMenuId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syMenuRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 메뉴 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyMenu entity = findById(id);
        syMenuRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyMenu save(String cmd, SyMenu entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getMenuId() == null || entity.getMenuId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getMenuId() == null)
                    throw new CmBizException("삭제 대상 menuId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syMenuRepository.existsById(entity.getMenuId()))
                    throw new CmBizException("존재하지 않는 SyMenu입니다: " + entity.getMenuId() + "::" + CmUtil.svcCallerInfo(this));
                syMenuRepository.deleteById(entity.getMenuId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setMenuId(CmUtil.generateId("sy_menu"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyMenu saved = syMenuRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getMenuId() == null)
                    throw new CmBizException("수정 대상 menuId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syMenuRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyMenu입니다: " + entity.getMenuId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getMenuId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyMenu> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyMenu row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getMenuId() == null || row.getMenuId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyMenu::getMenuId, "U", "menuId", this);
            CmUtil.requireRowIds(rows, SyMenu::getMenuId, "D", "menuId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyMenu::getMenuId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syMenuRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyMenu> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyMenu row : updateRows) {
                row.setUpdBy(authId);
                int affected = syMenuRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getMenuId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyMenu> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyMenu row : insertRows) {
                row.setMenuId(CmUtil.generateId("sy_menu"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syMenuRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
        /** getPathTreeNodeCounts — 표시경로 노드별 SyMenu 수 (검색조건 + 자손 누적, 트리 우측 뱃지용).
     *   sy_menu 는 path_id 컬럼 대신 menu_code 가 sy_path.path_id 와 일치하는 관례를 따른다.
     *   결과: { pathId: cnt, '__total__': 전체 } */
    public java.util.List<java.util.Map<String, Object>> getPathTreeNodeCounts(SyMenuDto.Request req) {
        return syMenuRepository.selectPathTreeCntsByBizCd(req);
    }

    private static String nullIfBlank(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }



    /** searchType csv 를 ',a,b,' 형태로 감싸 SQL `LIKE '%,a,%'` 매칭 가능하게 변환 */
    private static String wrapCsv(String s) {
        if (s == null || s.isBlank()) return null;
        return "," + s.trim().replaceAll("\\s*,\\s*", ",") + ",";
    }
}
