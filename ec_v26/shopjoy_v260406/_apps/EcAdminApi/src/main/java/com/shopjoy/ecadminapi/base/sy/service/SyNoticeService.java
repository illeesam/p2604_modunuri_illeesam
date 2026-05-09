package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyNoticeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNotice;
import com.shopjoy.ecadminapi.base.sy.mapper.SyNoticeMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyNoticeRepository;
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
public class SyNoticeService {

    private final SyNoticeMapper syNoticeMapper;
    private final SyNoticeRepository syNoticeRepository;

    @PersistenceContext
    private EntityManager em;

    public SyNoticeDto.Item getById(String id) {
        SyNoticeDto.Item dto = syNoticeMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public SyNotice findById(String id) {
        return syNoticeRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return syNoticeRepository.existsById(id);
    }

    public List<SyNoticeDto.Item> getList(SyNoticeDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syNoticeMapper.selectList(req);
    }

    public SyNoticeDto.PageResponse getPageData(SyNoticeDto.Request req) {
        PageHelper.addPaging(req);
        SyNoticeDto.PageResponse res = new SyNoticeDto.PageResponse();
        List<SyNoticeDto.Item> list = syNoticeMapper.selectPageList(req);
        long count = syNoticeMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public SyNotice create(SyNotice body) {
        body.setNoticeId(CmUtil.generateId("sy_notice"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyNotice saved = syNoticeRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getNoticeId());
    }

    @Transactional
    public SyNotice save(SyNotice entity) {
        if (!existsById(entity.getNoticeId()))
            throw new CmBizException("존재하지 않는 SyNotice입니다: " + entity.getNoticeId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyNotice saved = syNoticeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getNoticeId());
    }

    @Transactional
    public SyNotice update(String id, SyNotice body) {
        SyNotice entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "noticeId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyNotice saved = syNoticeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public SyNotice updatePartial(SyNotice entity) {
        if (entity.getNoticeId() == null) throw new CmBizException("noticeId 가 필요합니다.");
        if (!existsById(entity.getNoticeId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getNoticeId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syNoticeMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getNoticeId());
    }

    @Transactional
    public void delete(String id) {
        SyNotice entity = findById(id);
        syNoticeRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<SyNotice> saveList(List<SyNotice> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getNoticeId() != null)
            .map(SyNotice::getNoticeId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syNoticeRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<SyNotice> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getNoticeId() != null)
            .toList();
        for (SyNotice row : updateRows) {
            SyNotice entity = findById(row.getNoticeId());
            VoUtil.voCopyExclude(row, entity, "noticeId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syNoticeRepository.save(entity);
            upsertedIds.add(entity.getNoticeId());
        }
        em.flush();

        List<SyNotice> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyNotice row : insertRows) {
            row.setNoticeId(CmUtil.generateId("sy_notice"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syNoticeRepository.save(row);
            upsertedIds.add(row.getNoticeId());
        }
        em.flush();
        em.clear();

        List<SyNotice> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
