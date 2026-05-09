package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import com.shopjoy.ecadminapi.base.sy.mapper.SyCodeMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyCodeRepository;
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
public class SyCodeService {

    private final SyCodeMapper syCodeMapper;
    private final SyCodeRepository syCodeRepository;

    @PersistenceContext
    private EntityManager em;

    public SyCodeDto.Item getById(String id) {
        SyCodeDto.Item dto = syCodeMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public SyCode findById(String id) {
        return syCodeRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return syCodeRepository.existsById(id);
    }

    public List<SyCodeDto.Item> getList(SyCodeDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syCodeMapper.selectList(req);
    }

    public SyCodeDto.PageResponse getPageData(SyCodeDto.Request req) {
        PageHelper.addPaging(req);
        SyCodeDto.PageResponse res = new SyCodeDto.PageResponse();
        List<SyCodeDto.Item> list = syCodeMapper.selectPageList(req);
        long count = syCodeMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public SyCode create(SyCode body) {
        body.setCodeId(CmUtil.generateId("sy_code"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyCode saved = syCodeRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyCode save(SyCode entity) {
        if (!existsById(entity.getCodeId()))
            throw new CmBizException("존재하지 않는 SyCode입니다: " + entity.getCodeId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyCode saved = syCodeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyCode update(String id, SyCode body) {
        SyCode entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "codeId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyCode saved = syCodeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyCode updatePartial(SyCode entity) {
        if (entity.getCodeId() == null) throw new CmBizException("codeId 가 필요합니다.");
        if (!existsById(entity.getCodeId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCodeId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syCodeMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        SyCode entity = findById(id);
        syCodeRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<SyCode> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getCodeId() != null)
            .map(SyCode::getCodeId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syCodeRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyCode> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getCodeId() != null)
            .toList();
        for (SyCode row : updateRows) {
            SyCode entity = findById(row.getCodeId());
            VoUtil.voCopyExclude(row, entity, "codeId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syCodeRepository.save(entity);
        }
        em.flush();

        List<SyCode> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyCode row : insertRows) {
            row.setCodeId(CmUtil.generateId("sy_code"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syCodeRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
