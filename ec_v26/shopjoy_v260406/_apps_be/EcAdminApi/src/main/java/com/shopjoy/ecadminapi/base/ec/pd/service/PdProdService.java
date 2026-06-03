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

    /* 상품 키조회 */
    public PdProdDto.Item getById(String id) {
        PdProdDto.Item dto = pdProdRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdDto.Item getByIdOrNull(String id) {
        return pdProdRepository.selectById(id).orElse(null);
    }

    /* 상품 상세조회 */
    public PdProd findById(String id) {
        return pdProdRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProd findByIdOrNull(String id) {
        return pdProdRepository.findById(id).orElse(null);
    }

    /* 상품 키검증 */
    public boolean existsById(String id) {
        return pdProdRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdProdRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 상품 목록조회 */
    public List<PdProdDto.Item> getList(PdProdDto.Request req) {
        return pdProdRepository.selectList(req);
    }

    /* 상품 페이지조회 */
    public PdProdDto.PageResponse getPageData(PdProdDto.Request req) {
        PageHelper.addPaging(req);
        return pdProdRepository.selectPageData(req);
    }

    /* 상품 등록 */
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

    

    /* 상품 수정 */
    @Transactional
    public PdProd update(String id, PdProd body) {
        CmUtil.requireId(id, "id", this);
        PdProd entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "prodId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProd saved = pdProdRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 수정 */
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

    /* 상품 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdProd entity = findById(id);
        pdProdRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PdProd saveOneBase(PdProd entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getProdId() == null || entity.getProdId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getProdId() == null)
                throw new CmBizException("삭제 대상 prodId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!pdProdRepository.existsById(entity.getProdId()))
                throw new CmBizException("존재하지 않는 PdProd입니다: " + entity.getProdId() + "::" + CmUtil.svcCallerInfo(this));
            pdProdRepository.deleteById(entity.getProdId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setProdId(CmUtil.generateId("pd_prod"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            PdProd saved = pdProdRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getProdId() == null)
                throw new CmBizException("수정 대상 prodId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = pdProdRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PdProd입니다: " + entity.getProdId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getProdId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PdProd> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PdProd row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getProdId() == null || row.getProdId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PdProd::getProdId, "U", "prodId", this);
        CmUtil.requireRowIds(rows, PdProd::getProdId, "D", "prodId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PdProd::getProdId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PdProd> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PdProd row : updateRows) {
            row.setUpdBy(authId);
            int affected = pdProdRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getProdId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PdProd> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProd row : insertRows) {
            row.setProdId(CmUtil.generateId("pd_prod"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
