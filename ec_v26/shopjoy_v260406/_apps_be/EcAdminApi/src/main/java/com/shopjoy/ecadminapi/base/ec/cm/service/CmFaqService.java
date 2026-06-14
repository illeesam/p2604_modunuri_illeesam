package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmFaqDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmFaq;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmFaqRepository;
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
public class CmFaqService {

    private final CmFaqRepository cmFaqRepository;

    @PersistenceContext
    private EntityManager em;

    /* FAQ 키조회 */
    public CmFaqDto.Item getById(String id) {
        CmFaqDto.Item dto = cmFaqRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환) */
    public CmFaqDto.Item getByIdOrNull(String id) {
        return cmFaqRepository.selectById(id).orElse(null);
    }

    /* FAQ 상세조회 (Entity) */
    public CmFaq findById(String id) {
        return cmFaqRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /* FAQ 키검증 */
    public boolean existsById(String id) {
        return cmFaqRepository.existsById(id);
    }

    /* FAQ 목록조회 */
    public List<CmFaqDto.Item> getList(CmFaqDto.Request req) {
        return cmFaqRepository.selectList(req);
    }

    /* FAQ 페이지조회 */
    public CmFaqDto.PageResponse getPageData(CmFaqDto.Request req) {
        PageHelper.addPaging(req);
        return cmFaqRepository.selectPageData(req);
    }

    /* FAQ 등록 */
    @Transactional
    public CmFaq create(CmFaq body) {
        body.setFaqId(CmUtil.generateId("cm_faq"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmFaq saved = cmFaqRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* FAQ 수정 */
    @Transactional
    public CmFaq update(String id, CmFaq body) {
        CmUtil.requireId(id, "id", this);
        CmFaq entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "faqId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmFaq saved = cmFaqRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* FAQ 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        CmFaq entity = findById(id);
        cmFaqRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveListBase — 일괄 저장 (DELETE/UPDATE/INSERT 단계별). cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<CmFaq> rows) {
        /* 0단계: rowStatus 정규화 */
        for (CmFaq row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getFaqId() == null || row.getFaqId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, CmFaq::getFaqId, "U", "faqId", this);
        CmUtil.requireRowIds(rows, CmFaq::getFaqId, "D", "faqId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(CmFaq::getFaqId)
            .toList();
        if (!deleteIds.isEmpty()) {
            cmFaqRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<CmFaq> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (CmFaq row : updateRows) {
            row.setUpdBy(authId);
            int affected = cmFaqRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getFaqId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<CmFaq> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (CmFaq row : insertRows) {
            row.setFaqId(CmUtil.generateId("cm_faq"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            cmFaqRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
    }

    /** getPathTreeNodeCounts — 표시경로 노드별 FAQ 수 (검색조건 + 자손 누적, 트리 우측 뱃지용) */
    public java.util.List<java.util.Map<String, Object>> getPathTreeNodeCounts(CmFaqDto.Request req) {
        return cmFaqRepository.selectPathTreeFaqCnts(req);
    }
}
