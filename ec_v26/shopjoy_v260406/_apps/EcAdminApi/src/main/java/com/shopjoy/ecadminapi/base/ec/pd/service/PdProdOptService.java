package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdOptMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdOptRepository;
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
public class PdProdOptService {

    private final PdProdOptMapper pdProdOptMapper;
    private final PdProdOptRepository pdProdOptRepository;

    @PersistenceContext
    private EntityManager em;

    public PdProdOptDto.Item getById(String id) {
        PdProdOptDto.Item dto = pdProdOptMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdProdOpt findById(String id) {
        return pdProdOptRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pdProdOptRepository.existsById(id);
    }

    public List<PdProdOptDto.Item> getList(PdProdOptDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdProdOptMapper.selectList(req);
    }

    public PdProdOptDto.PageResponse getPageData(PdProdOptDto.Request req) {
        PageHelper.addPaging(req);
        PdProdOptDto.PageResponse res = new PdProdOptDto.PageResponse();
        List<PdProdOptDto.Item> list = pdProdOptMapper.selectPageList(req);
        long count = pdProdOptMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdProdOpt create(PdProdOpt body) {
        body.setOptId(CmUtil.generateId("pd_prod_opt"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProdOpt saved = pdProdOptRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getOptId());
    }

    @Transactional
    public PdProdOpt save(PdProdOpt entity) {
        if (!existsById(entity.getOptId()))
            throw new CmBizException("존재하지 않는 PdProdOpt입니다: " + entity.getOptId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdOpt saved = pdProdOptRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getOptId());
    }

    @Transactional
    public PdProdOpt update(String id, PdProdOpt body) {
        PdProdOpt entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "optId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdOpt saved = pdProdOptRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public PdProdOpt updatePartial(PdProdOpt entity) {
        if (entity.getOptId() == null) throw new CmBizException("optId 가 필요합니다.");
        if (!existsById(entity.getOptId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getOptId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdOptMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getOptId());
    }

    @Transactional
    public void delete(String id) {
        PdProdOpt entity = findById(id);
        pdProdOptRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<PdProdOpt> saveList(List<PdProdOpt> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getOptId() != null)
            .map(PdProdOpt::getOptId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdOptRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<PdProdOpt> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getOptId() != null)
            .toList();
        for (PdProdOpt row : updateRows) {
            PdProdOpt entity = findById(row.getOptId());
            VoUtil.voCopyExclude(row, entity, "optId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdProdOptRepository.save(entity);
            upsertedIds.add(entity.getOptId());
        }
        em.flush();

        List<PdProdOpt> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProdOpt row : insertRows) {
            row.setOptId(CmUtil.generateId("pd_prod_opt"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdOptRepository.save(row);
            upsertedIds.add(row.getOptId());
        }
        em.flush();
        em.clear();

        List<PdProdOpt> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
