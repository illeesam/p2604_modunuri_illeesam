package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategoryProd;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdCategoryProdMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdCategoryProdRepository;
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
public class PdCategoryProdService {

    private final PdCategoryProdMapper pdCategoryProdMapper;
    private final PdCategoryProdRepository pdCategoryProdRepository;

    @PersistenceContext
    private EntityManager em;

    public PdCategoryProdDto.Item getById(String id) {
        PdCategoryProdDto.Item dto = pdCategoryProdMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdCategoryProd findById(String id) {
        return pdCategoryProdRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pdCategoryProdRepository.existsById(id);
    }

    public List<PdCategoryProdDto.Item> getList(PdCategoryProdDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdCategoryProdMapper.selectList(VoUtil.voToMap(req));
    }

    public PdCategoryProdDto.PageResponse getPageData(PdCategoryProdDto.Request req) {
        PageHelper.addPaging(req);
        PdCategoryProdDto.PageResponse res = new PdCategoryProdDto.PageResponse();
        List<PdCategoryProdDto.Item> list = pdCategoryProdMapper.selectPageList(VoUtil.voToMap(req));
        long count = pdCategoryProdMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdCategoryProd create(PdCategoryProd body) {
        body.setCategoryProdId(CmUtil.generateId("pd_category_prod"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdCategoryProd saved = pdCategoryProdRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdCategoryProd save(PdCategoryProd entity) {
        if (!existsById(entity.getCategoryProdId()))
            throw new CmBizException("존재하지 않는 PdCategoryProd입니다: " + entity.getCategoryProdId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdCategoryProd saved = pdCategoryProdRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdCategoryProd update(String id, PdCategoryProd body) {
        PdCategoryProd entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "categoryProdId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdCategoryProd saved = pdCategoryProdRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdCategoryProd updatePartial(PdCategoryProd entity) {
        if (entity.getCategoryProdId() == null) throw new CmBizException("categoryProdId 가 필요합니다.");
        if (!existsById(entity.getCategoryProdId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCategoryProdId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdCategoryProdMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PdCategoryProd entity = findById(id);
        pdCategoryProdRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<PdCategoryProd> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getCategoryProdId() != null)
            .map(PdCategoryProd::getCategoryProdId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdCategoryProdRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdCategoryProd> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getCategoryProdId() != null)
            .toList();
        for (PdCategoryProd row : updateRows) {
            PdCategoryProd entity = findById(row.getCategoryProdId());
            VoUtil.voCopyExclude(row, entity, "categoryProdId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdCategoryProdRepository.save(entity);
        }
        em.flush();

        List<PdCategoryProd> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdCategoryProd row : insertRows) {
            row.setCategoryProdId(CmUtil.generateId("pd_category_prod"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdCategoryProdRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
