package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyTemplateDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import com.shopjoy.ecadminapi.base.sy.repository.SyTemplateRepository;
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
public class SyTemplateService {

    private final SyTemplateRepository syTemplateRepository;

    @PersistenceContext
    private EntityManager em;

    /* 템플릿 키조회 */
    public SyTemplateDto.Item getById(String id) {
        SyTemplateDto.Item dto = syTemplateRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyTemplateDto.Item getByIdOrNull(String id) {
        return syTemplateRepository.selectById(id).orElse(null);
    }

    /* 템플릿 상세조회 */
    public SyTemplate findById(String id) {
        return syTemplateRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyTemplate findByIdOrNull(String id) {
        return syTemplateRepository.findById(id).orElse(null);
    }

    /* 템플릿 키검증 */
    public boolean existsById(String id) {
        return syTemplateRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syTemplateRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 템플릿 목록조회 */
    public List<SyTemplateDto.Item> getList(SyTemplateDto.Request req) {
        return syTemplateRepository.selectList(req);
    }

    /* 템플릿 페이지조회 */
    public SyTemplateDto.PageResponse getPageData(SyTemplateDto.Request req) {
        PageHelper.addPaging(req);
        return syTemplateRepository.selectPageList(req);
    }

    /* 템플릿 등록 */
    @Transactional
    public SyTemplate create(SyTemplate body) {
        body.setTemplateId(CmUtil.generateId("sy_template"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyTemplate saved = syTemplateRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 템플릿 수정 */
    @Transactional
    public SyTemplate update(String id, SyTemplate body) {
        CmUtil.requireId(id, "id", this);
        SyTemplate entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "templateId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyTemplate saved = syTemplateRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 템플릿 수정 */
    @Transactional
    public SyTemplate updateSelective(SyTemplate entity) {
        if (entity.getTemplateId() == null) throw new CmBizException("templateId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getTemplateId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getTemplateId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syTemplateRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 템플릿 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyTemplate entity = findById(id);
        syTemplateRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyTemplate save(String cmd, SyTemplate entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getTemplateId() == null || entity.getTemplateId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getTemplateId() == null)
                    throw new CmBizException("삭제 대상 templateId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syTemplateRepository.existsById(entity.getTemplateId()))
                    throw new CmBizException("존재하지 않는 SyTemplate입니다: " + entity.getTemplateId() + "::" + CmUtil.svcCallerInfo(this));
                syTemplateRepository.deleteById(entity.getTemplateId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setTemplateId(CmUtil.generateId("sy_template"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyTemplate saved = syTemplateRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getTemplateId() == null)
                    throw new CmBizException("수정 대상 templateId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syTemplateRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyTemplate입니다: " + entity.getTemplateId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getTemplateId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyTemplate> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyTemplate row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getTemplateId() == null || row.getTemplateId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyTemplate::getTemplateId, "U", "templateId", this);
            CmUtil.requireRowIds(rows, SyTemplate::getTemplateId, "D", "templateId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyTemplate::getTemplateId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syTemplateRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyTemplate> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyTemplate row : updateRows) {
                row.setUpdBy(authId);
                int affected = syTemplateRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getTemplateId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyTemplate> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyTemplate row : insertRows) {
                row.setTemplateId(CmUtil.generateId("sy_template"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syTemplateRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
        /** getPathTreeNodeCounts — 표시경로 노드별 SyTemplate 수 (검색조건 + 자손 누적, 트리 우측 뱃지용).
     *   검색조건이 있으면 그 조건에 부합하는 row 만 카운트.
     *   결과: { pathId: cnt, '__total__': 전체, '__orphan__': path 없음 } */
    public java.util.List<java.util.Map<String, Object>> getPathTreeNodeCounts(SyTemplateDto.Request req) {
        java.util.List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        String useYn       = (req == null) ? null : nullIfBlank(req.getUseYn());
        String searchType  = (req == null) ? null : wrapCsv(req.getSearchType());
        String searchValue = (req == null) ? null : nullIfBlank(req.getSearchValue());
        String dateStart   = (req == null) ? null : nullIfBlank(req.getDateStart());
        String dateEnd     = (req == null) ? null : nullIfBlank(req.getDateEnd());
        for (Object[] row : syTemplateRepository.findPathSyTemplateTreeNodeCounts("sy_template", useYn, searchType, searchValue, dateStart, dateEnd)) {
            java.util.Map<String, Object> _m = new java.util.LinkedHashMap<>();

            _m.put("pathId", row[0] == null ? null : String.valueOf(row[0]));

            _m.put("cnt",    row[1] == null ? 0L   : ((Number) row[1]).longValue());

            result.add(_m);
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
