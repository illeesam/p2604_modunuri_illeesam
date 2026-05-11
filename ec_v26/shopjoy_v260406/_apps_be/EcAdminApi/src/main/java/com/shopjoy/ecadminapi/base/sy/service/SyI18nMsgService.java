package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nMsgDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18nMsg;
import com.shopjoy.ecadminapi.base.sy.mapper.SyI18nMsgMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyI18nMsgRepository;
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
public class SyI18nMsgService {

    private final SyI18nMsgMapper syI18nMsgMapper;
    private final SyI18nMsgRepository syI18nMsgRepository;

    @PersistenceContext
    private EntityManager em;

    public SyI18nMsgDto.Item getById(String id) {
        SyI18nMsgDto.Item dto = syI18nMsgMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public SyI18nMsg findById(String id) {
        return syI18nMsgRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return syI18nMsgRepository.existsById(id);
    }

    public List<SyI18nMsgDto.Item> getList(SyI18nMsgDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syI18nMsgMapper.selectList(VoUtil.voToMap(req));
    }

    public SyI18nMsgDto.PageResponse getPageData(SyI18nMsgDto.Request req) {
        PageHelper.addPaging(req);
        SyI18nMsgDto.PageResponse res = new SyI18nMsgDto.PageResponse();
        List<SyI18nMsgDto.Item> list = syI18nMsgMapper.selectPageList(VoUtil.voToMap(req));
        long count = syI18nMsgMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public SyI18nMsg create(SyI18nMsg body) {
        body.setI18nMsgId(CmUtil.generateId("sy_i18n_msg"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyI18nMsg saved = syI18nMsgRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyI18nMsg save(SyI18nMsg entity) {
        if (!existsById(entity.getI18nMsgId()))
            throw new CmBizException("존재하지 않는 SyI18nMsg입니다: " + entity.getI18nMsgId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyI18nMsg saved = syI18nMsgRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyI18nMsg update(String id, SyI18nMsg body) {
        SyI18nMsg entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "i18nMsgId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyI18nMsg saved = syI18nMsgRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public SyI18nMsg updateSelective(SyI18nMsg entity) {
        if (entity.getI18nMsgId() == null) throw new CmBizException("i18nMsgId 가 필요합니다.");
        if (!existsById(entity.getI18nMsgId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getI18nMsgId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syI18nMsgMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        SyI18nMsg entity = findById(id);
        syI18nMsgRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<SyI18nMsg> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getI18nMsgId() != null)
            .map(SyI18nMsg::getI18nMsgId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syI18nMsgRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyI18nMsg> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getI18nMsgId() != null)
            .toList();
        for (SyI18nMsg row : updateRows) {
            SyI18nMsg entity = findById(row.getI18nMsgId());
            VoUtil.voCopyExclude(row, entity, "i18nMsgId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syI18nMsgRepository.save(entity);
        }
        em.flush();

        List<SyI18nMsg> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyI18nMsg row : insertRows) {
            row.setI18nMsgId(CmUtil.generateId("sy_i18n_msg"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syI18nMsgRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
