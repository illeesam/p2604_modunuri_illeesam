package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayChgHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhPayChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhPayChgHistRepository;
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
public class OdhPayChgHistService {

    private final OdhPayChgHistMapper odhPayChgHistMapper;
    private final OdhPayChgHistRepository odhPayChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    public OdhPayChgHistDto.Item getById(String id) {
        OdhPayChgHistDto.Item dto = odhPayChgHistMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdhPayChgHist findById(String id) {
        return odhPayChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odhPayChgHistRepository.existsById(id);
    }

    public List<OdhPayChgHistDto.Item> getList(OdhPayChgHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odhPayChgHistMapper.selectList(VoUtil.voToMap(req));
    }

    public OdhPayChgHistDto.PageResponse getPageData(OdhPayChgHistDto.Request req) {
        PageHelper.addPaging(req);
        OdhPayChgHistDto.PageResponse res = new OdhPayChgHistDto.PageResponse();
        List<OdhPayChgHistDto.Item> list = odhPayChgHistMapper.selectPageList(VoUtil.voToMap(req));
        long count = odhPayChgHistMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdhPayChgHist create(OdhPayChgHist body) {
        body.setPayChgHistId(CmUtil.generateId("odh_pay_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhPayChgHist saved = odhPayChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhPayChgHist save(OdhPayChgHist entity) {
        if (!existsById(entity.getPayChgHistId()))
            throw new CmBizException("존재하지 않는 OdhPayChgHist입니다: " + entity.getPayChgHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhPayChgHist saved = odhPayChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhPayChgHist update(String id, OdhPayChgHist body) {
        OdhPayChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "payChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhPayChgHist saved = odhPayChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhPayChgHist updatePartial(OdhPayChgHist entity) {
        if (entity.getPayChgHistId() == null) throw new CmBizException("payChgHistId 가 필요합니다.");
        if (!existsById(entity.getPayChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPayChgHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhPayChgHistMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdhPayChgHist entity = findById(id);
        odhPayChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<OdhPayChgHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getPayChgHistId() != null)
            .map(OdhPayChgHist::getPayChgHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhPayChgHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdhPayChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getPayChgHistId() != null)
            .toList();
        for (OdhPayChgHist row : updateRows) {
            OdhPayChgHist entity = findById(row.getPayChgHistId());
            VoUtil.voCopyExclude(row, entity, "payChgHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odhPayChgHistRepository.save(entity);
        }
        em.flush();

        List<OdhPayChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhPayChgHist row : insertRows) {
            row.setPayChgHistId(CmUtil.generateId("odh_pay_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhPayChgHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
