package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptTypeDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOptType;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdOptTypeRepository;
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
public class PdProdOptTypeService {

    private final PdProdOptTypeRepository pdProdOptTypeRepository;

    @PersistenceContext
    private EntityManager em;

    /* 옵션유형 키조회 */
    public PdProdOptTypeDto.Item getById(String id) {
        PdProdOptTypeDto.Item dto = pdProdOptTypeRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    public PdProdOptTypeDto.Item getByIdOrNull(String id) {
        return pdProdOptTypeRepository.selectById(id).orElse(null);
    }

    /* 옵션유형 Entity 조회 */
    public PdProdOptType findById(String id) {
        return pdProdOptTypeRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    public PdProdOptType findByIdOrNull(String id) {
        return pdProdOptTypeRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pdProdOptTypeRepository.existsById(id);
    }

    /* 옵션유형 목록조회 */
    public List<PdProdOptTypeDto.Item> getList(PdProdOptTypeDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdProdOptTypeRepository.selectList(req);
    }

    public List<PdProdOptTypeDto.Item> getListByProdId(String prodId) {
        PdProdOptTypeDto.Request req = new PdProdOptTypeDto.Request();
        req.setProdId(prodId);
        return pdProdOptTypeRepository.selectList(req);
    }

    /* 옵션유형 페이지조회 */
    public PdProdOptTypeDto.PageResponse getPageData(PdProdOptTypeDto.Request req) {
        PageHelper.addPaging(req);
        return pdProdOptTypeRepository.selectPageData(req);
    }

    /* 옵션유형 등록 */
    @Transactional
    public PdProdOptType create(PdProdOptType body) {
        body.setProdOptTypeId(CmUtil.generateId("pd_prod_opt_type"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProdOptType saved = pdProdOptTypeRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 옵션유형 수정 */
    @Transactional
    public PdProdOptType update(String id, PdProdOptType body) {
        CmUtil.requireId(id, "id", this);
        PdProdOptType entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "prodOptTypeId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdOptType saved = pdProdOptTypeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdOptType updateSelective(PdProdOptType entity) {
        if (entity.getProdOptTypeId() == null) throw new CmBizException("prodOptTypeId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getProdOptTypeId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getProdOptTypeId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdOptTypeRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 옵션유형 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdProdOptType entity = findById(id);
        pdProdOptTypeRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 상품별 옵션유형 전체 삭제 */
    @Transactional
    public void deleteByProdId(String prodId) {
        pdProdOptTypeRepository.deleteByProdId(prodId);
        em.flush();
    }

    /** save — rowStatus(I/U/D/M) 단건 분기 처리 */
    @Transactional
    public PdProdOptType saveOneBase(PdProdOptType entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getProdOptTypeId() == null || entity.getProdOptTypeId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getProdOptTypeId() == null)
                throw new CmBizException("삭제 대상 prodOptTypeId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!pdProdOptTypeRepository.existsById(entity.getProdOptTypeId()))
                throw new CmBizException("존재하지 않는 PdProdOptType입니다: " + entity.getProdOptTypeId() + "::" + CmUtil.svcCallerInfo(this));
            pdProdOptTypeRepository.deleteById(entity.getProdOptTypeId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setProdOptTypeId(CmUtil.generateId("pd_prod_opt_type"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            PdProdOptType saved = pdProdOptTypeRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getProdOptTypeId() == null)
                throw new CmBizException("수정 대상 prodOptTypeId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = pdProdOptTypeRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PdProdOptType입니다: " + entity.getProdOptTypeId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getProdOptTypeId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList — 일괄 저장 */
    @Transactional
    public void saveListBase(List<PdProdOptType> rows) {
        for (PdProdOptType row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getProdOptTypeId() == null || row.getProdOptTypeId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PdProdOptType::getProdOptTypeId, "U", "prodOptTypeId", this);
        CmUtil.requireRowIds(rows, PdProdOptType::getProdOptTypeId, "D", "prodOptTypeId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PdProdOptType::getProdOptTypeId)
            .toList();
        if (!deleteIds.isEmpty()) pdProdOptTypeRepository.deleteAllById(deleteIds);

        List<PdProdOptType> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PdProdOptType row : updateRows) {
            row.setUpdBy(authId);
            int affected = pdProdOptTypeRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getProdOptTypeId() + "::" + CmUtil.svcCallerInfo(this));
        }

        List<PdProdOptType> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProdOptType row : insertRows) {
            row.setProdOptTypeId(CmUtil.generateId("pd_prod_opt_type"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdOptTypeRepository.save(row);
        }

        em.flush();
        em.clear();
    }
}
