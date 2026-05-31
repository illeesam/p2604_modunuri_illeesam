package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbm;
import com.shopjoy.ecadminapi.base.sy.repository.SyBbmRepository;
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
public class SyBbmService {

    private final SyBbmRepository syBbmRepository;

    @PersistenceContext
    private EntityManager em;

    /* 게시판 마스터 키조회 */
    public SyBbmDto.Item getById(String id) {
        SyBbmDto.Item dto = syBbmRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyBbmDto.Item getByIdOrNull(String id) {
        return syBbmRepository.selectById(id).orElse(null);
    }

    /* 게시판 마스터 상세조회 */
    public SyBbm findById(String id) {
        return syBbmRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyBbm findByIdOrNull(String id) {
        return syBbmRepository.findById(id).orElse(null);
    }

    /* 게시판 마스터 키검증 */
    public boolean existsById(String id) {
        return syBbmRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syBbmRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 게시판 마스터 목록조회 */
    public List<SyBbmDto.Item> getList(SyBbmDto.Request req) {
        return syBbmRepository.selectList(req);
    }

    /* 게시판 마스터 페이지조회 */
    public SyBbmDto.PageResponse getPageData(SyBbmDto.Request req) {
        PageHelper.addPaging(req);
        return syBbmRepository.selectPageList(req);
    }

    /* 게시판 마스터 등록 */
    @Transactional
    public SyBbm create(SyBbm body) {
        body.setBbmId(CmUtil.generateId("sy_bbm"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyBbm saved = syBbmRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 게시판 마스터 수정 */
    @Transactional
    public SyBbm update(String id, SyBbm body) {
        CmUtil.requireId(id, "id", this);
        SyBbm entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "bbmId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyBbm saved = syBbmRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 게시판 마스터 수정 */
    @Transactional
    public SyBbm updateSelective(SyBbm entity) {
        if (entity.getBbmId() == null) throw new CmBizException("bbmId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getBbmId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBbmId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syBbmRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 게시판 마스터 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyBbm entity = findById(id);
        syBbmRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyBbm save(String cmd, SyBbm entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getBbmId() == null || entity.getBbmId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getBbmId() == null)
                    throw new CmBizException("삭제 대상 bbmId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syBbmRepository.existsById(entity.getBbmId()))
                    throw new CmBizException("존재하지 않는 SyBbm입니다: " + entity.getBbmId() + "::" + CmUtil.svcCallerInfo(this));
                syBbmRepository.deleteById(entity.getBbmId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setBbmId(CmUtil.generateId("sy_bbm"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyBbm saved = syBbmRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getBbmId() == null)
                    throw new CmBizException("수정 대상 bbmId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syBbmRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyBbm입니다: " + entity.getBbmId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getBbmId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyBbm> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyBbm row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getBbmId() == null || row.getBbmId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyBbm::getBbmId, "U", "bbmId", this);
            CmUtil.requireRowIds(rows, SyBbm::getBbmId, "D", "bbmId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyBbm::getBbmId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syBbmRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyBbm> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyBbm row : updateRows) {
                row.setUpdBy(authId);
                int affected = syBbmRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getBbmId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyBbm> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyBbm row : insertRows) {
                row.setBbmId(CmUtil.generateId("sy_bbm"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syBbmRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
        /** getPathTreeNodeCounts — 표시경로 노드별 SyBbm 수 (검색조건 + 자손 누적, 트리 우측 뱃지용).
     *   검색조건이 있으면 그 조건에 부합하는 row 만 카운트.
     *   결과: { pathId: cnt, '__total__': 전체, '__orphan__': path 없음 } */
    public java.util.List<java.util.Map<String, Object>> getPathTreeNodeCounts(SyBbmDto.Request req) {
        return syBbmRepository.selectPathTreeBbmCnts(req);
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
