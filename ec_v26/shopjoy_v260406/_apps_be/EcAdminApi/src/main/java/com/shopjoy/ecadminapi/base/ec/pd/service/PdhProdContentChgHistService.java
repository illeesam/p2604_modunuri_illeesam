package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdContentChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdContentChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdContentChgHistRepository;
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
public class PdhProdContentChgHistService {

    private final PdhProdContentChgHistRepository pdhProdContentChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 상품 콘텐츠 변경 이력 키조회 */
    public PdhProdContentChgHistDto.Item getById(String id) {
        PdhProdContentChgHistDto.Item dto = pdhProdContentChgHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdhProdContentChgHistDto.Item getByIdOrNull(String id) {
        return pdhProdContentChgHistRepository.selectById(id).orElse(null);
    }

    /* 상품 콘텐츠 변경 이력 상세조회 */
    public PdhProdContentChgHist findById(String id) {
        return pdhProdContentChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdhProdContentChgHist findByIdOrNull(String id) {
        return pdhProdContentChgHistRepository.findById(id).orElse(null);
    }

    /* 상품 콘텐츠 변경 이력 키검증 */
    public boolean existsById(String id) {
        return pdhProdContentChgHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdhProdContentChgHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 상품 콘텐츠 변경 이력 목록조회 */
    public List<PdhProdContentChgHistDto.Item> getList(PdhProdContentChgHistDto.Request req) {
        return pdhProdContentChgHistRepository.selectList(req);
    }

    /* 상품 콘텐츠 변경 이력 페이지조회 */
    public PdhProdContentChgHistDto.PageResponse getPageData(PdhProdContentChgHistDto.Request req) {
        PageHelper.addPaging(req);
        return pdhProdContentChgHistRepository.selectPageList(req);
    }

    /* 상품 콘텐츠 변경 이력 등록 */
    @Transactional
    public PdhProdContentChgHist create(PdhProdContentChgHist body) {
        body.setHistId(CmUtil.generateId("pdh_prod_content_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdhProdContentChgHist saved = pdhProdContentChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 콘텐츠 변경 이력 저장 */
    @Transactional
    public PdhProdContentChgHist save(PdhProdContentChgHist entity) {
        if (!existsById(entity.getHistId()))
            throw new CmBizException("존재하지 않는 PdhProdContentChgHist입니다: " + entity.getHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdContentChgHist saved = pdhProdContentChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 콘텐츠 변경 이력 수정 */
    @Transactional
    public PdhProdContentChgHist update(String id, PdhProdContentChgHist body) {
        PdhProdContentChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "histId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdContentChgHist saved = pdhProdContentChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 콘텐츠 변경 이력 수정 */
    @Transactional
    public PdhProdContentChgHist updateSelective(PdhProdContentChgHist entity) {
        if (entity.getHistId() == null) throw new CmBizException("histId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdhProdContentChgHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 상품 콘텐츠 변경 이력 삭제 */
    @Transactional
    public void delete(String id) {
        PdhProdContentChgHist entity = findById(id);
        pdhProdContentChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 상품 콘텐츠 변경 이력 목록저장 */
    @Transactional
    public void saveList(List<PdhProdContentChgHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getHistId() != null)
            .map(PdhProdContentChgHist::getHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdhProdContentChgHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdhProdContentChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getHistId() != null)
            .toList();
        for (PdhProdContentChgHist row : updateRows) {
            PdhProdContentChgHist entity = findById(row.getHistId());
            VoUtil.voCopyExclude(row, entity, "histId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdhProdContentChgHistRepository.save(entity);
        }
        em.flush();

        List<PdhProdContentChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdhProdContentChgHist row : insertRows) {
            row.setHistId(CmUtil.generateId("pdh_prod_content_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdhProdContentChgHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
