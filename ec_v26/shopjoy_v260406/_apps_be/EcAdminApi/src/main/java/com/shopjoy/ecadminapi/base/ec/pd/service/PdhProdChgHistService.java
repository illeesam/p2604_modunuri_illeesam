package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdChgHistRepository;
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
public class PdhProdChgHistService {

    private final PdhProdChgHistRepository pdhProdChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 상품 변경 이력 키조회 */
    public PdhProdChgHistDto.Item getById(String id) {
        PdhProdChgHistDto.Item dto = pdhProdChgHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdhProdChgHistDto.Item getByIdOrNull(String id) {
        return pdhProdChgHistRepository.selectById(id).orElse(null);
    }

    /* 상품 변경 이력 상세조회 */
    public PdhProdChgHist findById(String id) {
        return pdhProdChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdhProdChgHist findByIdOrNull(String id) {
        return pdhProdChgHistRepository.findById(id).orElse(null);
    }

    /* 상품 변경 이력 키검증 */
    public boolean existsById(String id) {
        return pdhProdChgHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdhProdChgHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 상품 변경 이력 목록조회 */
    public List<PdhProdChgHistDto.Item> getList(PdhProdChgHistDto.Request req) {
        return pdhProdChgHistRepository.selectList(req);
    }

    /* 상품 변경 이력 페이지조회 */
    public PdhProdChgHistDto.PageResponse getPageData(PdhProdChgHistDto.Request req) {
        PageHelper.addPaging(req);
        return pdhProdChgHistRepository.selectPageList(req);
    }

    /* 상품 변경 이력 등록 */
    @Transactional
    public PdhProdChgHist create(PdhProdChgHist body) {
        body.setProdChgHistId(CmUtil.generateId("pdh_prod_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdhProdChgHist saved = pdhProdChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 변경 이력 저장 */
    @Transactional
    public PdhProdChgHist save(PdhProdChgHist entity) {
        if (!existsById(entity.getProdChgHistId()))
            throw new CmBizException("존재하지 않는 PdhProdChgHist입니다: " + entity.getProdChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdChgHist saved = pdhProdChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 변경 이력 수정 */
    @Transactional
    public PdhProdChgHist update(String id, PdhProdChgHist body) {
        PdhProdChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "prodChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdChgHist saved = pdhProdChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 변경 이력 수정 */
    @Transactional
    public PdhProdChgHist updateSelective(PdhProdChgHist entity) {
        if (entity.getProdChgHistId() == null) throw new CmBizException("prodChgHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getProdChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getProdChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdhProdChgHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 상품 변경 이력 삭제 */
    @Transactional
    public void delete(String id) {
        PdhProdChgHist entity = findById(id);
        pdhProdChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 상품 변경 이력 목록저장 */
    @Transactional
    public void saveList(List<PdhProdChgHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getProdChgHistId() != null)
            .map(PdhProdChgHist::getProdChgHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdhProdChgHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdhProdChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getProdChgHistId() != null)
            .toList();
        for (PdhProdChgHist row : updateRows) {
            PdhProdChgHist entity = findById(row.getProdChgHistId());
            VoUtil.voCopyExclude(row, entity, "prodChgHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdhProdChgHistRepository.save(entity);
        }
        em.flush();

        List<PdhProdChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdhProdChgHist row : insertRows) {
            row.setProdChgHistId(CmUtil.generateId("pdh_prod_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdhProdChgHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
