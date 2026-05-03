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
    private final PdCategoryMapper mapper;
    private final PdCategoryRepository repository;
    private final PdCategoryProdRepository categoryProdRepository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<PdCategoryDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<PdCategoryDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public PdCategoryDto getById(String id) {
        PdCategoryDto dto = mapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public PdCategory create(PdCategory body) {
        body.setCategoryId("CT" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdCategory saved = repository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    @Transactional
    public PdCategoryDto update(String id, PdCategory body) {
        PdCategory entity = repository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "categoryId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdCategory saved = repository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        PdCategory entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

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
    @Transactional
    public void saveList(List<PdCategory> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdCategory row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setCategoryId("CT" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                repository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getCategoryId(), "categoryId must not be null");
                PdCategory entity = repository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "categoryId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                repository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getCategoryId(), "categoryId must not be null");
                if (repository.existsById(id)) repository.deleteById(id);
            }
        }
        em.flush();
        em.clear();
    }
}