package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdClaimMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdClaimRepository;
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
public class OdClaimService {

    private final OdClaimMapper odClaimMapper;
    private final OdClaimRepository odClaimRepository;

    @PersistenceContext
    private EntityManager em;

    public OdClaimDto.Item getById(String id) {
        OdClaimDto.Item dto = odClaimMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdClaim findById(String id) {
        return odClaimRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odClaimRepository.existsById(id);
    }

    public List<OdClaimDto.Item> getList(OdClaimDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odClaimMapper.selectList(req);
    }

    public OdClaimDto.PageResponse getPageData(OdClaimDto.Request req) {
        PageHelper.addPaging(req);
        OdClaimDto.PageResponse res = new OdClaimDto.PageResponse();
        List<OdClaimDto.Item> list = odClaimMapper.selectPageList(req);
        long count = odClaimMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdClaim create(OdClaim body) {
        body.setClaimId(CmUtil.generateId("od_claim"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdClaim saved = odClaimRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getClaimId());
    }

    @Transactional
    public OdClaim save(OdClaim entity) {
        if (!existsById(entity.getClaimId()))
            throw new CmBizException("존재하지 않는 OdClaim입니다: " + entity.getClaimId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdClaim saved = odClaimRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getClaimId());
    }

    @Transactional
    public OdClaim update(String id, OdClaim body) {
        OdClaim entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "claimId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdClaim saved = odClaimRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public OdClaim updatePartial(OdClaim entity) {
        if (entity.getClaimId() == null) throw new CmBizException("claimId 가 필요합니다.");
        if (!existsById(entity.getClaimId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getClaimId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odClaimMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getClaimId());
    }

    @Transactional
    public void delete(String id) {
        OdClaim entity = findById(id);
        odClaimRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<OdClaim> saveList(List<OdClaim> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getClaimId() != null)
            .map(OdClaim::getClaimId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odClaimRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<OdClaim> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getClaimId() != null)
            .toList();
        for (OdClaim row : updateRows) {
            OdClaim entity = findById(row.getClaimId());
            VoUtil.voCopyExclude(row, entity, "claimId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odClaimRepository.save(entity);
            upsertedIds.add(entity.getClaimId());
        }
        em.flush();

        List<OdClaim> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdClaim row : insertRows) {
            row.setClaimId(CmUtil.generateId("od_claim"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odClaimRepository.save(row);
            upsertedIds.add(row.getClaimId());
        }
        em.flush();
        em.clear();

        List<OdClaim> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
