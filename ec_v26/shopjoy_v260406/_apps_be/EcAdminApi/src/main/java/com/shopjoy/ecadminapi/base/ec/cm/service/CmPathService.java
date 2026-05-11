package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmPathDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPath;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmPathMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmPathRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
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
public class CmPathService {

    private final CmPathMapper cmPathMapper;
    private final CmPathRepository cmPathRepository;

    @PersistenceContext
    private EntityManager em;

    public CmPathDto.Item getById(String id) {
        CmPathDto.Item dto = cmPathMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public CmPath findById(String id) {
        return cmPathRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return cmPathRepository.existsById(id);
    }

    public List<CmPathDto.Item> getList(CmPathDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return cmPathMapper.selectList(VoUtil.voToMap(req));
    }

    public CmPathDto.PageResponse getPageData(CmPathDto.Request req) {
        PageHelper.addPaging(req);
        CmPathDto.PageResponse res = new CmPathDto.PageResponse();
        List<CmPathDto.Item> list = cmPathMapper.selectPageList(VoUtil.voToMap(req));
        long count = cmPathMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public CmPath create(CmPath body) {
        if (body.getBizCd() == null) throw new CmBizException("bizCd 가 필요합니다.");
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmPath saved = cmPathRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public CmPath save(CmPath entity) {
        if (!existsById(entity.getBizCd()))
            throw new CmBizException("존재하지 않는 CmPath입니다: " + entity.getBizCd());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmPath saved = cmPathRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public CmPath update(String id, CmPath body) {
        CmPath entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "bizCd^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmPath saved = cmPathRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public CmPath updateSelective(CmPath entity) {
        if (entity.getBizCd() == null) throw new CmBizException("bizCd 가 필요합니다.");
        if (!existsById(entity.getBizCd()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBizCd());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmPathMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        CmPath entity = findById(id);
        cmPathRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<CmPath> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getBizCd() != null)
            .map(CmPath::getBizCd)
            .toList();
        if (!deleteIds.isEmpty()) {
            cmPathRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<CmPath> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getBizCd() != null)
            .toList();
        for (CmPath row : updateRows) {
            CmPath entity = findById(row.getBizCd());
            VoUtil.voCopyExclude(row, entity, "bizCd^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            cmPathRepository.save(entity);
        }
        em.flush();

        List<CmPath> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (CmPath row : insertRows) {
            if (row.getBizCd() == null) throw new CmBizException("bizCd 가 필요합니다.");
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            cmPathRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
