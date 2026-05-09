package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBrand;
import com.shopjoy.ecadminapi.base.sy.mapper.SyBrandMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyBrandRepository;
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
public class SyBrandService {

    private final SyBrandMapper syBrandMapper;
    private final SyBrandRepository syBrandRepository;

    @PersistenceContext
    private EntityManager em;

    public SyBrandDto.Item getById(String id) {
        SyBrandDto.Item dto = syBrandMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public SyBrand findById(String id) {
        return syBrandRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return syBrandRepository.existsById(id);
    }

    public List<SyBrandDto.Item> getList(SyBrandDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syBrandMapper.selectList(VoUtil.voToMap(req));
    }

    public SyBrandDto.PageResponse getPageData(SyBrandDto.Request req) {
        PageHelper.addPaging(req);
        SyBrandDto.PageResponse res = new SyBrandDto.PageResponse();
        List<SyBrandDto.Item> list = syBrandMapper.selectPageList(VoUtil.voToMap(req));
        long count = syBrandMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public SyBrand create(SyBrand body) {
        body.setBrandId(CmUtil.generateId("sy_brand"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyBrand saved = syBrandRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyBrand save(SyBrand entity) {
        if (!existsById(entity.getBrandId()))
            throw new CmBizException("존재하지 않는 SyBrand입니다: " + entity.getBrandId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyBrand saved = syBrandRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyBrand update(String id, SyBrand body) {
        SyBrand entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "brandId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyBrand saved = syBrandRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyBrand updatePartial(SyBrand entity) {
        if (entity.getBrandId() == null) throw new CmBizException("brandId 가 필요합니다.");
        if (!existsById(entity.getBrandId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBrandId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syBrandMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        SyBrand entity = findById(id);
        syBrandRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<SyBrand> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getBrandId() != null)
            .map(SyBrand::getBrandId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syBrandRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyBrand> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getBrandId() != null)
            .toList();
        for (SyBrand row : updateRows) {
            SyBrand entity = findById(row.getBrandId());
            VoUtil.voCopyExclude(row, entity, "brandId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syBrandRepository.save(entity);
        }
        em.flush();

        List<SyBrand> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyBrand row : insertRows) {
            row.setBrandId(CmUtil.generateId("sy_brand"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syBrandRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
