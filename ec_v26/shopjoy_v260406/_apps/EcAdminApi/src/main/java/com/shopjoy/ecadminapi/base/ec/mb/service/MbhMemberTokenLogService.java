package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbhMemberTokenLogMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbhMemberTokenLogRepository;
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
public class MbhMemberTokenLogService {

    private final MbhMemberTokenLogMapper mbhMemberTokenLogMapper;
    private final MbhMemberTokenLogRepository mbhMemberTokenLogRepository;

    @PersistenceContext
    private EntityManager em;

    public MbhMemberTokenLogDto.Item getById(String id) {
        MbhMemberTokenLogDto.Item dto = mbhMemberTokenLogMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public MbhMemberTokenLog findById(String id) {
        return mbhMemberTokenLogRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return mbhMemberTokenLogRepository.existsById(id);
    }

    public List<MbhMemberTokenLogDto.Item> getList(MbhMemberTokenLogDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return mbhMemberTokenLogMapper.selectList(req);
    }

    public MbhMemberTokenLogDto.PageResponse getPageData(MbhMemberTokenLogDto.Request req) {
        PageHelper.addPaging(req);
        MbhMemberTokenLogDto.PageResponse res = new MbhMemberTokenLogDto.PageResponse();
        List<MbhMemberTokenLogDto.Item> list = mbhMemberTokenLogMapper.selectPageList(req);
        long count = mbhMemberTokenLogMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public MbhMemberTokenLog create(MbhMemberTokenLog body) {
        body.setLogId(CmUtil.generateId("mbh_member_token_log"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbhMemberTokenLog saved = mbhMemberTokenLogRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbhMemberTokenLog save(MbhMemberTokenLog entity) {
        if (!existsById(entity.getLogId()))
            throw new CmBizException("존재하지 않는 MbhMemberTokenLog입니다: " + entity.getLogId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbhMemberTokenLog saved = mbhMemberTokenLogRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbhMemberTokenLog update(String id, MbhMemberTokenLog body) {
        MbhMemberTokenLog entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "logId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbhMemberTokenLog saved = mbhMemberTokenLogRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbhMemberTokenLog updatePartial(MbhMemberTokenLog entity) {
        if (entity.getLogId() == null) throw new CmBizException("logId 가 필요합니다.");
        if (!existsById(entity.getLogId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getLogId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbhMemberTokenLogMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        MbhMemberTokenLog entity = findById(id);
        mbhMemberTokenLogRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<MbhMemberTokenLog> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getLogId() != null)
            .map(MbhMemberTokenLog::getLogId)
            .toList();
        if (!deleteIds.isEmpty()) {
            mbhMemberTokenLogRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<MbhMemberTokenLog> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getLogId() != null)
            .toList();
        for (MbhMemberTokenLog row : updateRows) {
            MbhMemberTokenLog entity = findById(row.getLogId());
            VoUtil.voCopyExclude(row, entity, "logId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            mbhMemberTokenLogRepository.save(entity);
        }
        em.flush();

        List<MbhMemberTokenLog> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (MbhMemberTokenLog row : insertRows) {
            row.setLogId(CmUtil.generateId("mbh_member_token_log"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            mbhMemberTokenLogRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
