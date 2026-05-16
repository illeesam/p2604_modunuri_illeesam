package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdQnaDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdQna;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdQnaRepository;
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
public class PdProdQnaService {

    private final PdProdQnaRepository pdProdQnaRepository;

    @PersistenceContext
    private EntityManager em;

    /* 상품 문의 키조회 */
    public PdProdQnaDto.Item getById(String id) {
        PdProdQnaDto.Item dto = pdProdQnaRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdQnaDto.Item getByIdOrNull(String id) {
        return pdProdQnaRepository.selectById(id).orElse(null);
    }

    /* 상품 문의 상세조회 */
    public PdProdQna findById(String id) {
        return pdProdQnaRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdQna findByIdOrNull(String id) {
        return pdProdQnaRepository.findById(id).orElse(null);
    }

    /* 상품 문의 키검증 */
    public boolean existsById(String id) {
        return pdProdQnaRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdProdQnaRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 상품 문의 목록조회 */
    public List<PdProdQnaDto.Item> getList(PdProdQnaDto.Request req) {
        return pdProdQnaRepository.selectList(req);
    }

    /* 상품 문의 페이지조회 */
    public PdProdQnaDto.PageResponse getPageData(PdProdQnaDto.Request req) {
        PageHelper.addPaging(req);
        return pdProdQnaRepository.selectPageList(req);
    }

    /* 상품 문의 등록 */
    @Transactional
    public PdProdQna create(PdProdQna body) {
        body.setQnaId(CmUtil.generateId("pd_prod_qna"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProdQna saved = pdProdQnaRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 문의 저장 */
    @Transactional
    public PdProdQna save(PdProdQna entity) {
        if (!existsById(entity.getQnaId()))
            throw new CmBizException("존재하지 않는 PdProdQna입니다: " + entity.getQnaId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdQna saved = pdProdQnaRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 문의 수정 */
    @Transactional
    public PdProdQna update(String id, PdProdQna body) {
        PdProdQna entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "qnaId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdQna saved = pdProdQnaRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 문의 수정 */
    @Transactional
    public PdProdQna updateSelective(PdProdQna entity) {
        if (entity.getQnaId() == null) throw new CmBizException("qnaId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getQnaId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getQnaId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdQnaRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 상품 문의 삭제 */
    @Transactional
    public void delete(String id) {
        PdProdQna entity = findById(id);
        pdProdQnaRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 상품 문의 목록저장 */
    @Transactional
    public void saveList(List<PdProdQna> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getQnaId() != null)
            .map(PdProdQna::getQnaId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdQnaRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdProdQna> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getQnaId() != null)
            .toList();
        for (PdProdQna row : updateRows) {
            PdProdQna entity = findById(row.getQnaId());
            VoUtil.voCopyExclude(row, entity, "qnaId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdProdQnaRepository.save(entity);
        }
        em.flush();

        List<PdProdQna> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProdQna row : insertRows) {
            row.setQnaId(CmUtil.generateId("pd_prod_qna"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdQnaRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
