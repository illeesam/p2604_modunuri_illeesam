package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdRelDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdRel;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdRelMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdRelRepository;
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
public class PdProdRelService {

    private final PdProdRelMapper pdProdRelMapper;
    private final PdProdRelRepository pdProdRelRepository;

    @PersistenceContext
    private EntityManager em;

    public PdProdRelDto.Item getById(String id) {
        PdProdRelDto.Item dto = pdProdRelMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdProdRel findById(String id) {
        return pdProdRelRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pdProdRelRepository.existsById(id);
    }

    public List<PdProdRelDto.Item> getList(PdProdRelDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdProdRelMapper.selectList(VoUtil.voToMap(req));
    }

    public PdProdRelDto.PageResponse getPageData(PdProdRelDto.Request req) {
        PageHelper.addPaging(req);
        PdProdRelDto.PageResponse res = new PdProdRelDto.PageResponse();
        List<PdProdRelDto.Item> list = pdProdRelMapper.selectPageList(VoUtil.voToMap(req));
        long count = pdProdRelMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdProdRel create(PdProdRel body) {
        body.setProdRelId(CmUtil.generateId("pd_prod_rel"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProdRel saved = pdProdRelRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdRel save(PdProdRel entity) {
        if (!existsById(entity.getProdRelId()))
            throw new CmBizException("존재하지 않는 PdProdRel입니다: " + entity.getProdRelId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdRel saved = pdProdRelRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdRel update(String id, PdProdRel body) {
        PdProdRel entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "prodRelId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdRel saved = pdProdRelRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdRel updatePartial(PdProdRel entity) {
        if (entity.getProdRelId() == null) throw new CmBizException("prodRelId 가 필요합니다.");
        if (!existsById(entity.getProdRelId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getProdRelId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdRelMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PdProdRel entity = findById(id);
        pdProdRelRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<PdProdRel> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getProdRelId() != null)
            .map(PdProdRel::getProdRelId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdRelRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdProdRel> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getProdRelId() != null)
            .toList();
        for (PdProdRel row : updateRows) {
            PdProdRel entity = findById(row.getProdRelId());
            VoUtil.voCopyExclude(row, entity, "prodRelId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdProdRelRepository.save(entity);
        }
        em.flush();

        List<PdProdRel> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProdRel row : insertRows) {
            row.setProdRelId(CmUtil.generateId("pd_prod_rel"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdRelRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
