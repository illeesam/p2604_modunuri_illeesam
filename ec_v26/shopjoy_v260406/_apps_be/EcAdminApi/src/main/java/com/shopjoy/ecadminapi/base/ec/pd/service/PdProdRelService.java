package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdRelDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdRel;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdRelRepository;
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
public class PdProdRelService {

    private final PdProdRelRepository pdProdRelRepository;

    @PersistenceContext
    private EntityManager em;

    public PdProdRelDto.Item getById(String id) {
        PdProdRelDto.Item dto = pdProdRelRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdRelDto.Item getByIdOrNull(String id) {
        return pdProdRelRepository.selectById(id).orElse(null);
    }

    public PdProdRel findById(String id) {
        return pdProdRelRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdRel findByIdOrNull(String id) {
        return pdProdRelRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pdProdRelRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdProdRelRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PdProdRelDto.Item> getList(PdProdRelDto.Request req) {
        return pdProdRelRepository.selectList(req);
    }

    public PdProdRelDto.PageResponse getPageData(PdProdRelDto.Request req) {
        PageHelper.addPaging(req);
        return pdProdRelRepository.selectPageList(req);
    }

    @Transactional
    public PdProdRel create(PdProdRel body) {
        body.setProdRelId(CmUtil.generateId("pd_prod_rel"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProdRel saved = pdProdRelRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdRel save(PdProdRel entity) {
        if (!existsById(entity.getProdRelId()))
            throw new CmBizException("존재하지 않는 PdProdRel입니다: " + entity.getProdRelId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdRel saved = pdProdRelRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdRel update(String id, PdProdRel body) {
        PdProdRel entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "prodRelId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdRel saved = pdProdRelRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdRel updateSelective(PdProdRel entity) {
        if (entity.getProdRelId() == null) throw new CmBizException("prodRelId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getProdRelId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getProdRelId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdRelRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PdProdRel entity = findById(id);
        pdProdRelRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PdProdRel> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getProdRelId() != null)
            .map(PdProdRel::getProdRelId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdRelRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdProdRel> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getProdRelId() != null)
            .toList();
        for (PdProdRel row : updateRows) {
            PdProdRel entity = findById(row.getProdRelId());
            VoUtil.voCopyExclude(row, entity, "prodRelId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdProdRelRepository.save(entity);
        }
        em.flush();

        List<PdProdRel> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProdRel row : insertRows) {
            row.setProdRelId(CmUtil.generateId("pd_prod_rel"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdRelRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
