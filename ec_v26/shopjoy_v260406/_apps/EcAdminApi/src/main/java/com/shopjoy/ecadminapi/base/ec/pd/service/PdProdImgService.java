package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdImgDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdImg;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdImgMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdImgRepository;
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
public class PdProdImgService {

    private final PdProdImgMapper pdProdImgMapper;
    private final PdProdImgRepository pdProdImgRepository;

    @PersistenceContext
    private EntityManager em;

    public PdProdImgDto.Item getById(String id) {
        PdProdImgDto.Item dto = pdProdImgMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdProdImg findById(String id) {
        return pdProdImgRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pdProdImgRepository.existsById(id);
    }

    public List<PdProdImgDto.Item> getList(PdProdImgDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdProdImgMapper.selectList(req);
    }

    public PdProdImgDto.PageResponse getPageData(PdProdImgDto.Request req) {
        PageHelper.addPaging(req);
        PdProdImgDto.PageResponse res = new PdProdImgDto.PageResponse();
        List<PdProdImgDto.Item> list = pdProdImgMapper.selectPageList(req);
        long count = pdProdImgMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdProdImg create(PdProdImg body) {
        body.setProdImgId(CmUtil.generateId("pd_prod_img"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProdImg saved = pdProdImgRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getProdImgId());
    }

    @Transactional
    public PdProdImg save(PdProdImg entity) {
        if (!existsById(entity.getProdImgId()))
            throw new CmBizException("존재하지 않는 PdProdImg입니다: " + entity.getProdImgId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdImg saved = pdProdImgRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getProdImgId());
    }

    @Transactional
    public PdProdImg update(String id, PdProdImg body) {
        PdProdImg entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "prodImgId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdImg saved = pdProdImgRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public PdProdImg updatePartial(PdProdImg entity) {
        if (entity.getProdImgId() == null) throw new CmBizException("prodImgId 가 필요합니다.");
        if (!existsById(entity.getProdImgId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getProdImgId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdImgMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getProdImgId());
    }

    @Transactional
    public void delete(String id) {
        PdProdImg entity = findById(id);
        pdProdImgRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<PdProdImg> saveList(List<PdProdImg> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getProdImgId() != null)
            .map(PdProdImg::getProdImgId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdImgRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<PdProdImg> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getProdImgId() != null)
            .toList();
        for (PdProdImg row : updateRows) {
            PdProdImg entity = findById(row.getProdImgId());
            VoUtil.voCopyExclude(row, entity, "prodImgId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdProdImgRepository.save(entity);
            upsertedIds.add(entity.getProdImgId());
        }
        em.flush();

        List<PdProdImg> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProdImg row : insertRows) {
            row.setProdImgId(CmUtil.generateId("pd_prod_img"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdImgRepository.save(row);
            upsertedIds.add(row.getProdImgId());
        }
        em.flush();
        em.clear();

        List<PdProdImg> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
