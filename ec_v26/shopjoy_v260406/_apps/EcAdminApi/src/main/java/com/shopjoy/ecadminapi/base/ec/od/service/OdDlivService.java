package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdDlivMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdDlivRepository;
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
public class OdDlivService {

    private final OdDlivMapper odDlivMapper;
    private final OdDlivRepository odDlivRepository;

    @PersistenceContext
    private EntityManager em;

    public OdDlivDto.Item getById(String id) {
        OdDlivDto.Item dto = odDlivMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdDliv findById(String id) {
        return odDlivRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odDlivRepository.existsById(id);
    }

    public List<OdDlivDto.Item> getList(OdDlivDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odDlivMapper.selectList(req);
    }

    public OdDlivDto.PageResponse getPageData(OdDlivDto.Request req) {
        PageHelper.addPaging(req);
        OdDlivDto.PageResponse res = new OdDlivDto.PageResponse();
        List<OdDlivDto.Item> list = odDlivMapper.selectPageList(req);
        long count = odDlivMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdDliv create(OdDliv body) {
        body.setDlivId(CmUtil.generateId("od_dliv"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdDliv saved = odDlivRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdDliv save(OdDliv entity) {
        if (!existsById(entity.getDlivId()))
            throw new CmBizException("존재하지 않는 OdDliv입니다: " + entity.getDlivId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdDliv saved = odDlivRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdDliv update(String id, OdDliv body) {
        OdDliv entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "dlivId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdDliv saved = odDlivRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdDliv updatePartial(OdDliv entity) {
        if (entity.getDlivId() == null) throw new CmBizException("dlivId 가 필요합니다.");
        if (!existsById(entity.getDlivId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDlivId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odDlivMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdDliv entity = findById(id);
        odDlivRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<OdDliv> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getDlivId() != null)
            .map(OdDliv::getDlivId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odDlivRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdDliv> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getDlivId() != null)
            .toList();
        for (OdDliv row : updateRows) {
            OdDliv entity = findById(row.getDlivId());
            VoUtil.voCopyExclude(row, entity, "dlivId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odDlivRepository.save(entity);
        }
        em.flush();

        List<OdDliv> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdDliv row : insertRows) {
            row.setDlivId(CmUtil.generateId("od_dliv"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odDlivRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
