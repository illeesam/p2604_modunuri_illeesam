package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdContentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdContent;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdContentRepository;
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
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PdProdContentService {

    private final PdProdContentRepository pdProdContentRepository;

    @PersistenceContext
    private EntityManager em;

    /* 상품 상세 콘텐츠 키조회 */
    public PdProdContentDto.Item getById(String id) {
        PdProdContentDto.Item dto = pdProdContentRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdContentDto.Item getByIdOrNull(String id) {
        return pdProdContentRepository.selectById(id).orElse(null);
    }

    /* 상품 상세 콘텐츠 상세조회 */
    public PdProdContent findById(String id) {
        return pdProdContentRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdContent findByIdOrNull(String id) {
        return pdProdContentRepository.findById(id).orElse(null);
    }

    /* 상품 상세 콘텐츠 키검증 */
    public boolean existsById(String id) {
        return pdProdContentRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdProdContentRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 상품 상세 콘텐츠 목록조회 */
    public List<PdProdContentDto.Item> getList(PdProdContentDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdProdContentRepository.selectList(req);
    }

    /* 상품 상세 콘텐츠 페이지조회 */
    public PdProdContentDto.PageResponse getPageData(PdProdContentDto.Request req) {
        PageHelper.addPaging(req);
        return pdProdContentRepository.selectPageData(req);
    }

    /* 상품 상세 콘텐츠 등록 */
    @Transactional
    public PdProdContent create(PdProdContent body) {
        body.setProdContentId(CmUtil.generateId("pd_prod_content"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProdContent saved = pdProdContentRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 상품 상세 콘텐츠 수정 */
    @Transactional
    public PdProdContent update(String id, PdProdContent body) {
        CmUtil.requireId(id, "id", this);
        PdProdContent entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "prodContentId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdContent saved = pdProdContentRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 상세 콘텐츠 수정 */
    @Transactional
    public PdProdContent updateSelective(PdProdContent entity) {
        if (entity.getProdContentId() == null) throw new CmBizException("prodContentId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getProdContentId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getProdContentId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdContentRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 상품 상세 콘텐츠 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdProdContent entity = findById(id);
        pdProdContentRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PdProdContent saveOneBase(PdProdContent entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getProdContentId() == null || entity.getProdContentId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getProdContentId() == null)
                throw new CmBizException("삭제 대상 prodContentId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!pdProdContentRepository.existsById(entity.getProdContentId()))
                throw new CmBizException("존재하지 않는 PdProdContent입니다: " + entity.getProdContentId() + "::" + CmUtil.svcCallerInfo(this));
            pdProdContentRepository.deleteById(entity.getProdContentId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setProdContentId(CmUtil.generateId("pd_prod_content"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            PdProdContent saved = pdProdContentRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getProdContentId() == null)
                throw new CmBizException("수정 대상 prodContentId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = pdProdContentRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PdProdContent입니다: " + entity.getProdContentId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getProdContentId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PdProdContent> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PdProdContent row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getProdContentId() == null || row.getProdContentId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PdProdContent::getProdContentId, "U", "prodContentId", this);
        CmUtil.requireRowIds(rows, PdProdContent::getProdContentId, "D", "prodContentId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PdProdContent::getProdContentId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdContentRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PdProdContent> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PdProdContent row : updateRows) {
            row.setUpdBy(authId);
            int affected = pdProdContentRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getProdContentId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PdProdContent> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProdContent row : insertRows) {
            row.setProdContentId(CmUtil.generateId("pd_prod_content"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdContentRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
