package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryProdSaveDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategoryProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdCategoryProdRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPdCategoryProdService {

    private final PdCategoryProdRepository pdCategoryProdRepository;

    @PersistenceContext
    private EntityManager em;

    /** getPageData — 조회 */
    public PdCategoryProdDto.PageResponse getPageData(PdCategoryProdDto.Request req) {
        PageHelper.addPaging(req);
        return pdCategoryProdRepository.selectPageList(req);
    }

    /** saveProds — 저장 */
    @Transactional
    public void saveProds(PdCategoryProdSaveDto.Request req) {
        if (req == null || req.getCategoryProds() == null || req.getCategoryProds().isEmpty()) return;

        List<PdCategoryProdSaveDto.Row> rows = req.getCategoryProds();
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        for (PdCategoryProdSaveDto.Row row : rows) {
            String rowStatus = row.getRowStatus() != null ? row.getRowStatus() : "U";
            if ("D".equals(rowStatus)) {
                String id = row.getCategoryProdId();
                if (id != null && pdCategoryProdRepository.existsById(id)) {
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
                entity = new PdCategoryProd();
                entity.setCategoryProdId(CmUtil.generateId("pd_category_prod"));
                entity.setRegBy(authId);
                entity.setRegDate(now);
            } else {
                entity = pdCategoryProdRepository.findById(id)
                        .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
            }

            entity.setCategoryId(row.getCategoryId());
            entity.setProdId(row.getProdId());
            entity.setCategoryProdTypeCd(row.getTypeCd() != null ? row.getTypeCd() : row.getCategoryProdTypeCd());
            entity.setDispYn(row.getDispYn() != null ? row.getDispYn() : "Y");
            entity.setEmphasisCd(row.getEmphasisCd());
            if (row.getSortOrd() != null) entity.setSortOrd(row.getSortOrd());

            entity.setUpdBy(authId);
            entity.setUpdDate(now);

            pdCategoryProdRepository.save(entity);
        }
        em.flush();
        em.clear();
    }
}
