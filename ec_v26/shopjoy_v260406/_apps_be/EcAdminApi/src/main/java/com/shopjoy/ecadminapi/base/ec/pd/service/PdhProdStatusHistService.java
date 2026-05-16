package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdStatusHist;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdStatusHistRepository;
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
public class PdhProdStatusHistService {

    private final PdhProdStatusHistRepository pdhProdStatusHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 상품 상태 이력 키조회 */
    public PdhProdStatusHistDto.Item getById(String id) {
        PdhProdStatusHistDto.Item dto = pdhProdStatusHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdhProdStatusHistDto.Item getByIdOrNull(String id) {
        return pdhProdStatusHistRepository.selectById(id).orElse(null);
    }

    /* 상품 상태 이력 상세조회 */
    public PdhProdStatusHist findById(String id) {
        return pdhProdStatusHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdhProdStatusHist findByIdOrNull(String id) {
        return pdhProdStatusHistRepository.findById(id).orElse(null);
    }

    /* 상품 상태 이력 키검증 */
    public boolean existsById(String id) {
        return pdhProdStatusHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdhProdStatusHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 상품 상태 이력 목록조회 */
    public List<PdhProdStatusHistDto.Item> getList(PdhProdStatusHistDto.Request req) {
        return pdhProdStatusHistRepository.selectList(req);
    }

    /* 상품 상태 이력 페이지조회 */
    public PdhProdStatusHistDto.PageResponse getPageData(PdhProdStatusHistDto.Request req) {
        PageHelper.addPaging(req);
        return pdhProdStatusHistRepository.selectPageList(req);
    }

    /* 상품 상태 이력 등록 */
    @Transactional
    public PdhProdStatusHist create(PdhProdStatusHist body) {
        body.setProdStatusHistId(CmUtil.generateId("pdh_prod_status_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdhProdStatusHist saved = pdhProdStatusHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 상태 이력 저장 */
    @Transactional
    public PdhProdStatusHist save(PdhProdStatusHist entity) {
        if (!existsById(entity.getProdStatusHistId()))
            throw new CmBizException("존재하지 않는 PdhProdStatusHist입니다: " + entity.getProdStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdStatusHist saved = pdhProdStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 상태 이력 수정 */
    @Transactional
    public PdhProdStatusHist update(String id, PdhProdStatusHist body) {
        PdhProdStatusHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "prodStatusHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdStatusHist saved = pdhProdStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 상태 이력 수정 */
    @Transactional
    public PdhProdStatusHist updateSelective(PdhProdStatusHist entity) {
        if (entity.getProdStatusHistId() == null) throw new CmBizException("prodStatusHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getProdStatusHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getProdStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdhProdStatusHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 상품 상태 이력 삭제 */
    @Transactional
    public void delete(String id) {
        PdhProdStatusHist entity = findById(id);
        pdhProdStatusHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 상품 상태 이력 목록저장 */
    @Transactional
    public void saveList(List<PdhProdStatusHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getProdStatusHistId() != null)
            .map(PdhProdStatusHist::getProdStatusHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdhProdStatusHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdhProdStatusHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getProdStatusHistId() != null)
            .toList();
        for (PdhProdStatusHist row : updateRows) {
            PdhProdStatusHist entity = findById(row.getProdStatusHistId());
            VoUtil.voCopyExclude(row, entity, "prodStatusHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdhProdStatusHistRepository.save(entity);
        }
        em.flush();

        List<PdhProdStatusHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdhProdStatusHist row : insertRows) {
            row.setProdStatusHistId(CmUtil.generateId("pdh_prod_status_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdhProdStatusHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
