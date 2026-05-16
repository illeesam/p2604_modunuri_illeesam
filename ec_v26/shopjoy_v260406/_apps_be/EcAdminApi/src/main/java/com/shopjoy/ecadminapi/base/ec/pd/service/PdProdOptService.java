package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdOptRepository;
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
public class PdProdOptService {

    private final PdProdOptRepository pdProdOptRepository;

    @PersistenceContext
    private EntityManager em;

    /* 상품 옵션 키조회 */
    public PdProdOptDto.Item getById(String id) {
        PdProdOptDto.Item dto = pdProdOptRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdOptDto.Item getByIdOrNull(String id) {
        return pdProdOptRepository.selectById(id).orElse(null);
    }

    /* 상품 옵션 상세조회 */
    public PdProdOpt findById(String id) {
        return pdProdOptRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdOpt findByIdOrNull(String id) {
        return pdProdOptRepository.findById(id).orElse(null);
    }

    /* 상품 옵션 키검증 */
    public boolean existsById(String id) {
        return pdProdOptRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdProdOptRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 상품 옵션 목록조회 */
    public List<PdProdOptDto.Item> getList(PdProdOptDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdProdOptRepository.selectList(req);
    }

    /* 상품 옵션 페이지조회 */
    public PdProdOptDto.PageResponse getPageData(PdProdOptDto.Request req) {
        PageHelper.addPaging(req);
        return pdProdOptRepository.selectPageList(req);
    }

    /* 상품 옵션 등록 */
    @Transactional
    public PdProdOpt create(PdProdOpt body) {
        body.setOptId(CmUtil.generateId("pd_prod_opt"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProdOpt saved = pdProdOptRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 옵션 저장 */
    @Transactional
    public PdProdOpt save(PdProdOpt entity) {
        if (!existsById(entity.getOptId()))
            throw new CmBizException("존재하지 않는 PdProdOpt입니다: " + entity.getOptId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdOpt saved = pdProdOptRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 옵션 수정 */
    @Transactional
    public PdProdOpt update(String id, PdProdOpt body) {
        PdProdOpt entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "optId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdOpt saved = pdProdOptRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 옵션 수정 */
    @Transactional
    public PdProdOpt updateSelective(PdProdOpt entity) {
        if (entity.getOptId() == null) throw new CmBizException("optId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getOptId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getOptId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdOptRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 상품 옵션 삭제 */
    @Transactional
    public void delete(String id) {
        PdProdOpt entity = findById(id);
        pdProdOptRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 상품 옵션 목록저장 */
    @Transactional
    public void saveList(List<PdProdOpt> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getOptId() != null)
            .map(PdProdOpt::getOptId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdOptRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdProdOpt> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getOptId() != null)
            .toList();
        for (PdProdOpt row : updateRows) {
            PdProdOpt entity = findById(row.getOptId());
            VoUtil.voCopyExclude(row, entity, "optId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdProdOptRepository.save(entity);
        }
        em.flush();

        List<PdProdOpt> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProdOpt row : insertRows) {
            row.setOptId(CmUtil.generateId("pd_prod_opt"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdOptRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
