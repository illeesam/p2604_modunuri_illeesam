package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCodeGrp;
import com.shopjoy.ecadminapi.base.sy.repository.SyCodeGrpRepository;
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
public class SyCodeGrpService {

    private final SyCodeGrpRepository syCodeGrpRepository;

    @PersistenceContext
    private EntityManager em;

    /* 공통 코드 그룹 키조회 */
    public SyCodeGrpDto.Item getById(String id) {
        SyCodeGrpDto.Item dto = syCodeGrpRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyCodeGrpDto.Item getByIdOrNull(String id) {
        return syCodeGrpRepository.selectById(id).orElse(null);
    }

    /* 공통 코드 그룹 상세조회 */
    public SyCodeGrp findById(String id) {
        return syCodeGrpRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyCodeGrp findByIdOrNull(String id) {
        return syCodeGrpRepository.findById(id).orElse(null);
    }

    /* 공통 코드 그룹 키검증 */
    public boolean existsById(String id) {
        return syCodeGrpRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syCodeGrpRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 공통 코드 그룹 목록조회 */
    public List<SyCodeGrpDto.Item> getList(SyCodeGrpDto.Request req) {
        return syCodeGrpRepository.selectList(req);
    }

    /* 공통 코드 그룹 페이지조회 */
    public SyCodeGrpDto.PageResponse getPageData(SyCodeGrpDto.Request req) {
        PageHelper.addPaging(req);
        return syCodeGrpRepository.selectPageList(req);
    }

    /* 공통 코드 그룹 등록 */
    @Transactional
    public SyCodeGrp create(SyCodeGrp body) {
        body.setCodeGrpId(CmUtil.generateId("sy_code_grp"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyCodeGrp saved = syCodeGrpRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 공통 코드 그룹 수정 */
    @Transactional
    public SyCodeGrp update(String id, SyCodeGrp body) {
        CmUtil.requireId(id, "id", this);
        SyCodeGrp entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "codeGrpId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyCodeGrp saved = syCodeGrpRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 공통 코드 그룹 수정 */
    @Transactional
    public SyCodeGrp updateSelective(SyCodeGrp entity) {
        if (entity.getCodeGrpId() == null) throw new CmBizException("codeGrpId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getCodeGrpId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCodeGrpId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syCodeGrpRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 공통 코드 그룹 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyCodeGrp entity = findById(id);
        syCodeGrpRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyCodeGrp save(String cmd, SyCodeGrp entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getCodeGrpId() == null || entity.getCodeGrpId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getCodeGrpId() == null)
                    throw new CmBizException("삭제 대상 codeGrpId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syCodeGrpRepository.existsById(entity.getCodeGrpId()))
                    throw new CmBizException("존재하지 않는 SyCodeGrp입니다: " + entity.getCodeGrpId() + "::" + CmUtil.svcCallerInfo(this));
                syCodeGrpRepository.deleteById(entity.getCodeGrpId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setCodeGrpId(CmUtil.generateId("sy_code_grp"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyCodeGrp saved = syCodeGrpRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getCodeGrpId() == null)
                    throw new CmBizException("수정 대상 codeGrpId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syCodeGrpRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyCodeGrp입니다: " + entity.getCodeGrpId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getCodeGrpId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyCodeGrp> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyCodeGrp row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getCodeGrpId() == null || row.getCodeGrpId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyCodeGrp::getCodeGrpId, "U", "codeGrpId", this);
            CmUtil.requireRowIds(rows, SyCodeGrp::getCodeGrpId, "D", "codeGrpId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyCodeGrp::getCodeGrpId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syCodeGrpRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyCodeGrp> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyCodeGrp row : updateRows) {
                row.setUpdBy(authId);
                int affected = syCodeGrpRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getCodeGrpId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyCodeGrp> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyCodeGrp row : insertRows) {
                row.setCodeGrpId(CmUtil.generateId("sy_code_grp"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syCodeGrpRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
        /** getPathTreeNodeCounts — 표시경로 노드별 SyCodeGrp 수 (검색조건 + 자손 누적, 트리 우측 뱃지용).
     *   검색조건이 있으면 그 조건에 부합하는 row 만 카운트.
     *   결과: { pathId: cnt, '__total__': 전체, '__orphan__': path 없음 } */
    public java.util.List<java.util.Map<String, Object>> getPathTreeNodeCounts(SyCodeGrpDto.Request req) {
        return syCodeGrpRepository.selectPathTreeCntsByBizCd(req);
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
