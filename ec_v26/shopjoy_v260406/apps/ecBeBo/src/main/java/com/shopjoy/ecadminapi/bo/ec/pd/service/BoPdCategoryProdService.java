package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryProdSaveDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategoryProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdCategoryProdRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPdCategoryProdService {

    private final PdCategoryProdRepository pdCategoryProdRepository;

    @PersistenceContext
    private EntityManager em;

    /** getPageData — 조회 */
    public BasePage<PdCategoryProdDto.Item> getPageData(PdCategoryProdDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 상품-카테고리 연결 (N:N, 복수 카테고리·타입 등록) 페이지 조회
        return pdCategoryProdRepository.selectPageData(req);
    }

    /** saveProds — 저장 */
    @Transactional
    public void saveProds(PdCategoryProdSaveDto.Request req) {
        if (req == null || req.getCategoryProds() == null || req.getCategoryProds().isEmpty()) return;

        List<PdCategoryProdSaveDto.Row> rows = req.getCategoryProds();

        for (PdCategoryProdSaveDto.Row row : rows) {
            String rowStatus = row.getRowStatus() != null ? row.getRowStatus() : "U";
            if ("D".equals(rowStatus)) {
                String id = row.getCategoryProdId();
                // [쿼리 메서드] 상품-카테고리 연결 (N:N, 복수 카테고리·타입 등록) 존재 여부 확인
                if (id != null && pdCategoryProdRepository.existsById(id)) {
                    // [쿼리 메서드] 상품-카테고리 연결 (N:N, 복수 카테고리·타입 등록) ID 기준 삭제
                    pdCategoryProdRepository.deleteById(id);
                }
            }
        }
        em.flush();
        em.clear();

        for (PdCategoryProdSaveDto.Row row : rows) {
            String rowStatus = row.getRowStatus() != null ? row.getRowStatus() : "U";
            if ("D".equals(rowStatus)) continue;

            String id = row.getCategoryProdId();

            PdCategoryProd entity;
            if ("I".equals(rowStatus) || id == null || id.startsWith("CP_")) {
                /* 감사컬럼은 EntitySaveListener 가 @PrePersist/@PreUpdate 에서 주입 */
                entity = PdCategoryProd.builder()
                    .categoryProdId(CmUtil.generateId("pd_category_prod"))
                    .build();
            } else {
                // [쿼리 메서드] 상품-카테고리 연결 (N:N, 복수 카테고리·타입 등록) 단건 조회
                entity = pdCategoryProdRepository.findById(id)
                        .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
            }

            entity.setCategoryId(row.getCategoryId());
            entity.setProdId(row.getProdId());
            entity.setCategoryProdTypeCd(row.getTypeCd() != null ? row.getTypeCd() : row.getCategoryProdTypeCd());
            entity.setDispYn(row.getDispYn() != null ? row.getDispYn() : "Y");
            entity.setEmphasisCd(row.getEmphasisCd());
            if (row.getSortOrd() != null) entity.setSortOrd(row.getSortOrd());

            // [쿼리 메서드] 상품-카테고리 연결 (N:N, 복수 카테고리·타입 등록) 저장
            pdCategoryProdRepository.save(entity);
        }
        em.flush();
        em.clear();
    }
}
