package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategory;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdCategoryMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdCategoryRepository;
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
public class PdCategoryService {

    private final PdCategoryMapper pdCategoryMapper;
    private final PdCategoryRepository pdCategoryRepository;

    @PersistenceContext
    private EntityManager em;

    public PdCategoryDto.Item getById(String id) {
        PdCategoryDto.Item dto = pdCategoryMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdCategory findById(String id) {
        return pdCategoryRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pdCategoryRepository.existsById(id);
    }

    public List<PdCategoryDto.Item> getList(PdCategoryDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdCategoryMapper.selectList(req);
    }

    public PdCategoryDto.PageResponse getPageData(PdCategoryDto.Request req) {
        PageHelper.addPaging(req);
        PdCategoryDto.PageResponse res = new PdCategoryDto.PageResponse();
        List<PdCategoryDto.Item> list = pdCategoryMapper.selectPageList(req);
        long count = pdCategoryMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdCategory create(PdCategory body) {
        body.setCategoryId(CmUtil.generateId("pd_category"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdCategory saved = pdCategoryRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getCategoryId());
    }

    @Transactional
    public PdCategory save(PdCategory entity) {
        if (!existsById(entity.getCategoryId()))
            throw new CmBizException("존재하지 않는 PdCategory입니다: " + entity.getCategoryId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdCategory saved = pdCategoryRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getCategoryId());
    }

    @Transactional
    public PdCategory update(String id, PdCategory body) {
        PdCategory entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "categoryId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdCategory saved = pdCategoryRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public PdCategory updatePartial(PdCategory entity) {
        if (entity.getCategoryId() == null) throw new CmBizException("categoryId 가 필요합니다.");
        if (!existsById(entity.getCategoryId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCategoryId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdCategoryMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getCategoryId());
    }

    @Transactional
    public void delete(String id) {
        PdCategory entity = findById(id);
        pdCategoryRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<PdCategory> saveList(List<PdCategory> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getCategoryId() != null)
            .map(PdCategory::getCategoryId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdCategoryRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<PdCategory> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getCategoryId() != null)
            .toList();
        for (PdCategory row : updateRows) {
            PdCategory entity = findById(row.getCategoryId());
            VoUtil.voCopyExclude(row, entity, "categoryId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdCategoryRepository.save(entity);
            upsertedIds.add(entity.getCategoryId());
        }
        em.flush();

        List<PdCategory> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdCategory row : insertRows) {
            row.setCategoryId(CmUtil.generateId("pd_category"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdCategoryRepository.save(row);
            upsertedIds.add(row.getCategoryId());
        }
        em.flush();
        em.clear();

        List<PdCategory> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
