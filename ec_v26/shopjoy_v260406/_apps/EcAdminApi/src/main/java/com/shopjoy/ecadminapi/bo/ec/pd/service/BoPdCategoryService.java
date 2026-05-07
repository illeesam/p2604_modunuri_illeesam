package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategory;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategoryProd;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdCategoryMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdCategoryProdRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdCategoryRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class BoPdCategoryService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final PdCategoryMapper pdCategoryMapper;
    private final PdCategoryRepository pdCategoryRepository;
    private final PdCategoryProdRepository categoryProdRepository;
    @PersistenceContext
    private EntityManager em;

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<PdCategoryDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return pdCategoryMapper.selectList(p);
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<PdCategoryDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(pdCategoryMapper.selectPageList(p), pdCategoryMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** getById — 조회 */
    @Transactional(readOnly = true)
    public PdCategoryDto getById(String id) {
        PdCategoryDto dto = pdCategoryMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    /** create — 생성 */
    @Transactional
    public PdCategory create(PdCategory body) {
        body.setCategoryId("CT" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdCategory saved = pdCategoryRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    /** update — 수정 */
    @Transactional
    public PdCategoryDto update(String id, PdCategory body) {
        PdCategory entity = pdCategoryRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "categoryId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdCategory saved = pdCategoryRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        PdCategory entity = pdCategoryRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        pdCategoryRepository.delete(entity);
        em.flush();
        if (pdCategoryRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** updateProds — 수정 */
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
    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PdCategory> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getCategoryId() != null)
            .map(PdCategory::getCategoryId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdCategoryRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        for (PdCategory row : rows) {
            if (!"U".equals(row.getRowStatus())) continue;
            String id = Objects.requireNonNull(row.getCategoryId(), "categoryId must not be null");
            PdCategory entity = pdCategoryRepository.findById(id)
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
            VoUtil.voCopyExclude(row, entity, "categoryId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdCategoryRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        for (PdCategory row : rows) {
            if (!"I".equals(row.getRowStatus())) continue;
            row.setCategoryId("CT" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdCategoryRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
