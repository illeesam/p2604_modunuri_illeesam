package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategory;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategoryProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdCategoryProdRepository;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdCategoryService;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * BO 카테고리 서비스 — base PdCategoryService 위임 (thin wrapper) + updateProds.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPdCategoryService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final PdCategoryService pdCategoryService;
    private final PdCategoryProdRepository categoryProdRepository;

    @PersistenceContext
    private EntityManager em;

    public PdCategoryDto.Item getById(String id) { return pdCategoryService.getById(id); }
    public List<PdCategoryDto.Item> getList(PdCategoryDto.Request req) { return pdCategoryService.getList(req); }
    public PdCategoryDto.PageResponse getPageData(PdCategoryDto.Request req) { return pdCategoryService.getPageData(req); }

    @Transactional public PdCategory create(PdCategory body) { return pdCategoryService.create(body); }
    @Transactional public PdCategory update(String id, PdCategory body) { return pdCategoryService.update(id, body); }
    @Transactional public void delete(String id) { pdCategoryService.delete(id); }
    @Transactional public void saveList(List<PdCategory> rows) { pdCategoryService.saveList(rows); }

    /** updateProds — 카테고리에 상품 일괄 매핑 */
    @Transactional
    public void updateProds(String categoryId, String activeTypeCd, Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> prods = (List<Map<String, Object>>) body.get("prods");
        if (prods == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        categoryProdRepository.deleteByCategoryIdAndCategoryProdTypeCd(categoryId, activeTypeCd);
        em.flush();
        int seq = 1;
        for (Map<String, Object> row : prods) {
            PdCategoryProd cp = new PdCategoryProd();
            String cpId = (String) row.get("categoryProdId");
            if (cpId == null || cpId.startsWith("CP_")) {
                cpId = "CP" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000));
            }
            cp.setCategoryProdId(cpId);
            cp.setCategoryId(categoryId);
            cp.setProdId((String) row.get("prodId"));
            cp.setCategoryProdTypeCd(activeTypeCd);
            Object sortOrdObj = row.get("sortOrd");
            cp.setSortOrd(sortOrdObj != null ? ((Number) sortOrdObj).intValue() : seq);
            cp.setDispYn(row.get("dispYn") != null ? (String) row.get("dispYn") : "Y");
            cp.setRegBy(updBy);
            cp.setRegDate(LocalDateTime.now());
            cp.setUpdBy(updBy);
            cp.setUpdDate(LocalDateTime.now());
            categoryProdRepository.save(cp);
            seq++;
        }
    }
}
