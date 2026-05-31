package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorRepository;
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
public class SyVendorService {

    private final SyVendorRepository syVendorRepository;

    @PersistenceContext
    private EntityManager em;

    /* 업체(판매자) 키조회 */
    public SyVendorDto.Item getById(String id) {
        SyVendorDto.Item dto = syVendorRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyVendorDto.Item getByIdOrNull(String id) {
        return syVendorRepository.selectById(id).orElse(null);
    }

    /* 업체(판매자) 상세조회 */
    public SyVendor findById(String id) {
        return syVendorRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyVendor findByIdOrNull(String id) {
        return syVendorRepository.findById(id).orElse(null);
    }

    /* 업체(판매자) 키검증 */
    public boolean existsById(String id) {
        return syVendorRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syVendorRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 업체(판매자) 목록조회 */
    public List<SyVendorDto.Item> getList(SyVendorDto.Request req) {
        return syVendorRepository.selectList(req);
    }

    /* 업체(판매자) 페이지조회 */
    public SyVendorDto.PageResponse getPageData(SyVendorDto.Request req) {
        PageHelper.addPaging(req);
        return syVendorRepository.selectPageList(req);
    }

    /* 업체(판매자) 등록 */
    @Transactional
    public SyVendor create(SyVendor body) {
        body.setVendorId(CmUtil.generateId("sy_vendor"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyVendor saved = syVendorRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 업체(판매자) 수정 */
    @Transactional
    public SyVendor update(String id, SyVendor body) {
        CmUtil.requireId(id, "id", this);
        SyVendor entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "vendorId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyVendor saved = syVendorRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 업체(판매자) 수정 */
    @Transactional
    public SyVendor updateSelective(SyVendor entity) {
        if (entity.getVendorId() == null) throw new CmBizException("vendorId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getVendorId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getVendorId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syVendorRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 업체(판매자) 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyVendor entity = findById(id);
        syVendorRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyVendor save(String cmd, SyVendor entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getVendorId() == null || entity.getVendorId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getVendorId() == null)
                    throw new CmBizException("삭제 대상 vendorId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syVendorRepository.existsById(entity.getVendorId()))
                    throw new CmBizException("존재하지 않는 SyVendor입니다: " + entity.getVendorId() + "::" + CmUtil.svcCallerInfo(this));
                syVendorRepository.deleteById(entity.getVendorId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setVendorId(CmUtil.generateId("sy_vendor"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyVendor saved = syVendorRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getVendorId() == null)
                    throw new CmBizException("수정 대상 vendorId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syVendorRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyVendor입니다: " + entity.getVendorId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getVendorId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyVendor> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyVendor row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getVendorId() == null || row.getVendorId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyVendor::getVendorId, "U", "vendorId", this);
            CmUtil.requireRowIds(rows, SyVendor::getVendorId, "D", "vendorId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyVendor::getVendorId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syVendorRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyVendor> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyVendor row : updateRows) {
                row.setUpdBy(authId);
                int affected = syVendorRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getVendorId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyVendor> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyVendor row : insertRows) {
                row.setVendorId(CmUtil.generateId("sy_vendor"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syVendorRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
        /** getPathTreeNodeCounts — 표시경로 노드별 SyVendor 수 (검색조건 + 자손 누적, 트리 우측 뱃지용).
     *   검색조건이 있으면 그 조건에 부합하는 row 만 카운트.
     *   결과: { pathId: cnt, '__total__': 전체, '__orphan__': path 없음 } */
    public java.util.Map<String, Long> getPathTreeNodeCounts(SyVendorDto.Request req) {
        java.util.Map<String, Long> result = new java.util.LinkedHashMap<>();
        String statusCd    = (req == null) ? null : nullIfBlank(req.getStatus());
        String searchType  = (req == null) ? null : wrapCsv(req.getSearchType());
        String searchValue = (req == null) ? null : nullIfBlank(req.getSearchValue());
        String dateStart   = (req == null) ? null : nullIfBlank(req.getDateStart());
        String dateEnd     = (req == null) ? null : nullIfBlank(req.getDateEnd());
        for (Object[] row : syVendorRepository.findPathSyVendorTreeNodeCounts("sy_vendor", statusCd, searchType, searchValue, dateStart, dateEnd)) {
            String pathId = row[0] == null ? null : String.valueOf(row[0]);
            Long cnt = row[1] == null ? 0L : ((Number) row[1]).longValue();
            result.put(pathId, cnt);
        }
        return result;
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
