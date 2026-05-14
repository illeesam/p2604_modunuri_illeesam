package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdRepository;
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
public class PdProdService {

    private final PdProdRepository pdProdRepository;

    @PersistenceContext
    private EntityManager em;

    public PdProdDto.Item getById(String id) {
        PdProdDto.Item dto = pdProdRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdDto.Item getByIdOrNull(String id) {
        return pdProdRepository.selectById(id).orElse(null);
    }

    public PdProd findById(String id) {
        return pdProdRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProd findByIdOrNull(String id) {
        return pdProdRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pdProdRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdProdRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PdProdDto.Item> getList(PdProdDto.Request req) {
        return pdProdRepository.selectList(req);
    }

    public PdProdDto.PageResponse getPageData(PdProdDto.Request req) {
        PageHelper.addPaging(req);
        return pdProdRepository.selectPageList(req);
    }

    @Transactional
    public PdProd create(PdProd body) {
        body.setProdId(CmUtil.generateId("pd_prod"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProd saved = pdProdRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProd save(PdProd entity) {
        if (!existsById(entity.getProdId()))
            throw new CmBizException("존재하지 않는 PdProd입니다: " + entity.getProdId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProd saved = pdProdRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProd update(String id, PdProd body) {
        PdProd entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "prodId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProd saved = pdProdRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProd updateSelective(PdProd entity) {
        if (entity.getProdId() == null) throw new CmBizException("prodId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getProdId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getProdId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PdProd entity = findById(id);
        pdProdRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PdProd> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getProdId() != null)
            .map(PdProd::getProdId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdProd> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getProdId() != null)
            .toList();
        for (PdProd row : updateRows) {
            PdProd entity = findById(row.getProdId());
            VoUtil.voCopyExclude(row, entity, "prodId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdProdRepository.save(entity);
        }
        em.flush();

        List<PdProd> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProd row : insertRows) {
            row.setProdId(CmUtil.generateId("pd_prod"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
