package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBrand;
import com.shopjoy.ecadminapi.base.sy.repository.SyBrandRepository;
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
public class SyBrandService {

    private final SyBrandRepository syBrandRepository;

    @PersistenceContext
    private EntityManager em;

    /* 브랜드 키조회 */
    public SyBrandDto.Item getById(String id) {
        SyBrandDto.Item dto = syBrandRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyBrandDto.Item getByIdOrNull(String id) {
        return syBrandRepository.selectById(id).orElse(null);
    }

    /* 브랜드 상세조회 */
    public SyBrand findById(String id) {
        return syBrandRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyBrand findByIdOrNull(String id) {
        return syBrandRepository.findById(id).orElse(null);
    }

    /* 브랜드 키검증 */
    public boolean existsById(String id) {
        return syBrandRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syBrandRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 브랜드 목록조회 */
    public List<SyBrandDto.Item> getList(SyBrandDto.Request req) {
        return syBrandRepository.selectList(req);
    }

    /* 브랜드 페이지조회 */
    public SyBrandDto.PageResponse getPageData(SyBrandDto.Request req) {
        PageHelper.addPaging(req);
        return syBrandRepository.selectPageList(req);
    }

    /* 브랜드 등록 */
    @Transactional
    public SyBrand create(SyBrand body) {
        body.setBrandId(CmUtil.generateId("sy_brand"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyBrand saved = syBrandRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 브랜드 수정 */
    @Transactional
    public SyBrand update(String id, SyBrand body) {
        CmUtil.requireId(id, "id", this);
        SyBrand entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "brandId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyBrand saved = syBrandRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 브랜드 수정 */
    @Transactional
    public SyBrand updateSelective(SyBrand entity) {
        if (entity.getBrandId() == null) throw new CmBizException("brandId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getBrandId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBrandId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syBrandRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 브랜드 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyBrand entity = findById(id);
        syBrandRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyBrand save(String cmd, SyBrand entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getBrandId() == null || entity.getBrandId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getBrandId() == null)
                    throw new CmBizException("삭제 대상 brandId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syBrandRepository.existsById(entity.getBrandId()))
                    throw new CmBizException("존재하지 않는 SyBrand입니다: " + entity.getBrandId() + "::" + CmUtil.svcCallerInfo(this));
                syBrandRepository.deleteById(entity.getBrandId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setBrandId(CmUtil.generateId("sy_brand"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyBrand saved = syBrandRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getBrandId() == null)
                    throw new CmBizException("수정 대상 brandId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syBrandRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyBrand입니다: " + entity.getBrandId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getBrandId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyBrand> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyBrand row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getBrandId() == null || row.getBrandId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyBrand::getBrandId, "U", "brandId", this);
            CmUtil.requireRowIds(rows, SyBrand::getBrandId, "D", "brandId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyBrand::getBrandId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syBrandRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyBrand> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyBrand row : updateRows) {
                row.setUpdBy(authId);
                int affected = syBrandRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getBrandId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyBrand> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyBrand row : insertRows) {
                row.setBrandId(CmUtil.generateId("sy_brand"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syBrandRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
    /** getPathTreeNodeCounts — 표시경로 노드별 SyBrand 수 (검색조건 + 자손 누적, 트리 우측 뱃지용).
     *   검색조건 (vendorId / searchValue / dateStart / dateEnd) 이 있으면 그 조건에 부합하는 row 만 카운트.
     *   결과: { pathId: cnt, '__total__': 전체, '__orphan__': path 없음 } */
    public java.util.Map<String, Long> getPathTreeNodeCounts(SyBrandDto.Request req) {
        java.util.Map<String, Long> result = new java.util.LinkedHashMap<>();
        String vendorId    = (req == null) ? null : nullIfBlank(req.getVendorId());
        String searchType  = (req == null) ? null : wrapCsv(req.getSearchType());
        String searchValue = (req == null) ? null : nullIfBlank(req.getSearchValue());
        String dateStart   = (req == null) ? null : nullIfBlank(req.getDateStart());
        String dateEnd     = (req == null) ? null : nullIfBlank(req.getDateEnd());
        for (Object[] row : syBrandRepository.findPathSyBrandTreeNodeCounts(vendorId, searchType, searchValue, dateStart, dateEnd)) {
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
