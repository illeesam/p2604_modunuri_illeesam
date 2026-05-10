package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPayMethod;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdPayMethodMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdPayMethodRepository;
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
public class OdPayMethodService {

    private final OdPayMethodMapper odPayMethodMapper;
    private final OdPayMethodRepository odPayMethodRepository;

    @PersistenceContext
    private EntityManager em;

    public OdPayMethodDto.Item getById(String id) {
        OdPayMethodDto.Item dto = odPayMethodMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdPayMethod findById(String id) {
        return odPayMethodRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odPayMethodRepository.existsById(id);
    }

    public List<OdPayMethodDto.Item> getList(OdPayMethodDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odPayMethodMapper.selectList(VoUtil.voToMap(req));
    }

    public OdPayMethodDto.PageResponse getPageData(OdPayMethodDto.Request req) {
        PageHelper.addPaging(req);
        OdPayMethodDto.PageResponse res = new OdPayMethodDto.PageResponse();
        List<OdPayMethodDto.Item> list = odPayMethodMapper.selectPageList(VoUtil.voToMap(req));
        long count = odPayMethodMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdPayMethod create(OdPayMethod body) {
        body.setPayMethodId(CmUtil.generateId("od_pay_method"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdPayMethod saved = odPayMethodRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdPayMethod save(OdPayMethod entity) {
        if (!existsById(entity.getPayMethodId()))
            throw new CmBizException("존재하지 않는 OdPayMethod입니다: " + entity.getPayMethodId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdPayMethod saved = odPayMethodRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdPayMethod update(String id, OdPayMethod body) {
        OdPayMethod entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "payMethodId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdPayMethod saved = odPayMethodRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdPayMethod updatePartial(OdPayMethod entity) {
        if (entity.getPayMethodId() == null) throw new CmBizException("payMethodId 가 필요합니다.");
        if (!existsById(entity.getPayMethodId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPayMethodId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odPayMethodMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdPayMethod entity = findById(id);
        odPayMethodRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<OdPayMethod> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getPayMethodId() != null)
            .map(OdPayMethod::getPayMethodId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odPayMethodRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdPayMethod> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getPayMethodId() != null)
            .toList();
        for (OdPayMethod row : updateRows) {
            OdPayMethod entity = findById(row.getPayMethodId());
            VoUtil.voCopyExclude(row, entity, "payMethodId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odPayMethodRepository.save(entity);
        }
        em.flush();

        List<OdPayMethod> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdPayMethod row : insertRows) {
            row.setPayMethodId(CmUtil.generateId("od_pay_method"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odPayMethodRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
