package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryUpdateProdsDto;
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

    /* 키조회 */
    public PdCategoryDto.Item getById(String id) { return pdCategoryService.getById(id); }
    /* 목록조회 */
    public List<PdCategoryDto.Item> getList(PdCategoryDto.Request req) { return pdCategoryService.getList(req); }
    /* 페이지조회 */
    public PdCategoryDto.PageResponse getPageData(PdCategoryDto.Request req) { return pdCategoryService.getPageData(req); }

    @Transactional public PdCategory create(PdCategory body) { return pdCategoryService.create(body); }
    @Transactional public PdCategory update(String id, PdCategory body) { return pdCategoryService.update(id, body); }
    @Transactional public void delete(String id) { pdCategoryService.delete(id); }
    @Transactional public void saveList(List<PdCategory> rows) { pdCategoryService.saveList(rows); }

    /** updateProds — 카테고리에 상품 일괄 매핑 */
    @Transactional
    public void updateProds(String categoryId, String activeTypeCd, PdCategoryUpdateProdsDto.Request req) {
        if (req == null || req.getProds() == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        categoryProdRepository.deleteByCategoryIdAndCategoryProdTypeCd(categoryId, activeTypeCd);
        em.flush();
        int seq = 1;
        for (PdCategoryUpdateProdsDto.Row row : req.getProds()) {
            PdCategoryProd cp = new PdCategoryProd();
            String cpId = row.getCategoryProdId();
            if (cpId == null || cpId.startsWith("CP_")) {
                cpId = "CP" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000));
            }
            cp.setCategoryProdId(cpId);
            cp.setCategoryId(categoryId);
            cp.setProdId(row.getProdId());
            cp.setCategoryProdTypeCd(activeTypeCd);
            cp.setSortOrd(row.getSortOrd() != null ? row.getSortOrd() : seq);
            cp.setDispYn(row.getDispYn() != null ? row.getDispYn() : "Y");
            cp.setRegBy(updBy);
            cp.setRegDate(LocalDateTime.now());
            cp.setUpdBy(updBy);
            cp.setUpdDate(LocalDateTime.now());
            categoryProdRepository.save(cp);
            seq++;
        }
    }
}
