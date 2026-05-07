package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategoryProd;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdCategoryProdMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdCategoryProdRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoPdCategoryProdService {

    private final PdCategoryProdMapper pdCategoryProdMapper;
    private final PdCategoryProdRepository pdCategoryProdRepository;
    @PersistenceContext
    private EntityManager em;

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<PdCategoryProdDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(
                pdCategoryProdMapper.selectPageList(p),
                pdCategoryProdMapper.selectPageCount(p),
                PageHelper.getPageNo(),
                PageHelper.getPageSize(),
                p);
    }

    /** saveProds — 저장 */
    @Transactional
    public void saveProds(Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) body.get("categoryProds");
        if (rows == null || rows.isEmpty()) return;

        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // DELETE 먼저 일괄 처리 후 flush — insert와 순서 보장
        for (Map<String, Object> row : rows) {
            if ("D".equals(row.getOrDefault("rowStatus", "U"))) {
                String id = (String) row.get("categoryProdId");
                if (id != null && pdCategoryProdRepository.existsById(id)) {
                    pdCategoryProdRepository.deleteById(id);
                }
            }
        }
        em.flush();
        em.clear(); // 1차 캐시 초기화 — 이후 조회가 DB에서 최신 상태를 읽도록

        // INSERT / UPDATE 처리
        for (Map<String, Object> row : rows) {
            String rowStatus = (String) row.getOrDefault("rowStatus", "U");
            if ("D".equals(rowStatus)) continue;

            String id = (String) row.get("categoryProdId");

            PdCategoryProd entity;
            if ("I".equals(rowStatus) || id == null || id.startsWith("CP_")) {
                entity = new PdCategoryProd();
                entity.setCategoryProdId(CmUtil.generateId("pd_category_prod"));
                entity.setRegBy(authId);
                entity.setRegDate(now);
            } else {
                entity = pdCategoryProdRepository.findById(id)
                        .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
            }

            entity.setCategoryId((String) row.get("categoryId"));
            entity.setProdId((String) row.get("prodId"));
            entity.setCategoryProdTypeCd((String) row.getOrDefault("typeCd", row.get("categoryProdTypeCd")));
            entity.setDispYn((String) row.getOrDefault("dispYn", "Y"));
            entity.setEmphasisCd((String) row.get("emphasisCd"));

            Object sortOrd = row.get("sortOrd");
            if (sortOrd != null) entity.setSortOrd(((Number) sortOrd).intValue());

            entity.setUpdBy(authId);
            entity.setUpdDate(now);

            pdCategoryProdRepository.save(entity);
        }
        em.flush();
        em.clear();
    }
}
