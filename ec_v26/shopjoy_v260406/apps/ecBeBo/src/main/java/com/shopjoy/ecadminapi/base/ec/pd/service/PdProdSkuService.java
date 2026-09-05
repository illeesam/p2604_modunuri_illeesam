package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSkuDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSku;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdSkuRepository;
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
public class PdProdSkuService {

    private final PdProdSkuRepository pdProdSkuRepository;

    @PersistenceContext
    private EntityManager em;

    /* 상품 SKU 키조회 */
    public PdProdSkuDto.Item getById(String id) {
        // [QueryDSL] 상품 옵션 SKU (조합별 재고/가격) 단건 조회
        PdProdSkuDto.Item dto = pdProdSkuRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdSkuDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 상품 옵션 SKU (조합별 재고/가격) 단건 조회
        return pdProdSkuRepository.selectById(id).orElse(null);
    }

    /* 상품 SKU 상세조회 */
    public PdProdSku findById(String id) {
        // [쿼리 메서드] 상품 옵션 SKU (조합별 재고/가격) 단건 조회
        return pdProdSkuRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdSku findByIdOrNull(String id) {
        // [쿼리 메서드] 상품 옵션 SKU (조합별 재고/가격) 단건 조회
        return pdProdSkuRepository.findById(id).orElse(null);
    }

    /* 상품 SKU 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 상품 옵션 SKU (조합별 재고/가격) 존재 여부 확인
        return pdProdSkuRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 상품 옵션 SKU (조합별 재고/가격) 존재 여부 확인
        if (!pdProdSkuRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 상품 SKU 목록조회 */
    public List<PdProdSkuDto.Item> getList(PdProdSkuDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        // [QueryDSL] 상품 옵션 SKU (조합별 재고/가격) 목록 조회
        return pdProdSkuRepository.selectList(req);
    }

    /* 상품 SKU 페이지조회 */
    public BasePage<PdProdSkuDto.Item> getPageData(PdProdSkuDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 상품 옵션 SKU (조합별 재고/가격) 페이지 조회
        return pdProdSkuRepository.selectPageData(req);
    }

    /* 상품 SKU 등록 */
    @Transactional
    public PdProdSku create(PdProdSku body) {
        if (body.getProdSkuId() == null || body.getProdSkuId().isBlank())
            body.setProdSkuId(CmUtil.generateId("pd_prod_sku"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 상품 옵션 SKU (조합별 재고/가격) 저장
        PdProdSku saved = pdProdSkuRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 상품 SKU 수정 */
    @Transactional
    public PdProdSku update(String id, PdProdSku body) {
        CmUtil.requireId(id, "id", this);
        PdProdSku entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "skuId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 상품 옵션 SKU (조합별 재고/가격) 저장
        PdProdSku saved = pdProdSkuRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 SKU 수정 */
    @Transactional
    public PdProdSku updateSelective(PdProdSku entity) {
        if (entity.getProdSkuId() == null) throw new CmBizException("skuId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getProdSkuId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getProdSkuId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 상품 옵션 SKU (조합별 재고/가격) 선택적 필드 수정
        int affected = pdProdSkuRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 상품 SKU 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdProdSku entity = findById(id);
        // [쿼리 메서드] 상품 옵션 SKU (조합별 재고/가격) 삭제
        pdProdSkuRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PdProdSku saveOneBase(PdProdSku entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getProdSkuId());

        if ("D".equals(rowStatus)) {
            if (entity.getProdSkuId() == null)
                throw new CmBizException("삭제 대상 skuId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 상품 옵션 SKU (조합별 재고/가격) 존재 여부 확인
            if (!pdProdSkuRepository.existsById(entity.getProdSkuId()))
                throw new CmBizException("존재하지 않는 PdProdSku입니다: " + entity.getProdSkuId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 상품 옵션 SKU (조합별 재고/가격) ID 기준 삭제
            pdProdSkuRepository.deleteById(entity.getProdSkuId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setProdSkuId(CmUtil.generateId("pd_prod_sku"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 상품 옵션 SKU (조합별 재고/가격) 저장
            PdProdSku saved = pdProdSkuRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getProdSkuId() == null)
                throw new CmBizException("수정 대상 skuId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 상품 옵션 SKU (조합별 재고/가격) 선택적 필드 수정
            int affected = pdProdSkuRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PdProdSku입니다: " + entity.getProdSkuId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getProdSkuId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PdProdSku> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PdProdSku row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getProdSkuId() == null || row.getProdSkuId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PdProdSku::getProdSkuId, "U", "prodSkuId", this);
        CmUtil.requireRowIds(rows, PdProdSku::getProdSkuId, "D", "prodSkuId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PdProdSku::getProdSkuId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 상품 옵션 SKU (조합별 재고/가격) 조건별 삭제
            pdProdSkuRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PdProdSku> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PdProdSku row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 상품 옵션 SKU (조합별 재고/가격) 선택적 필드 수정
            int affected = pdProdSkuRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getProdSkuId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PdProdSku> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProdSku row : insertRows) {
            row.setProdSkuId(CmUtil.generateId("pd_prod_sku"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 상품 옵션 SKU (조합별 재고/가격) 저장
            pdProdSkuRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
