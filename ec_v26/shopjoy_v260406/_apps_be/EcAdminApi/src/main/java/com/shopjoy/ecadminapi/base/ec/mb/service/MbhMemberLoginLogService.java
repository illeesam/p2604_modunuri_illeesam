package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginLog;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbhMemberLoginLogMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbhMemberLoginLogRepository;
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
public class MbhMemberLoginLogService {

    private final MbhMemberLoginLogMapper mbhMemberLoginLogMapper;
    private final MbhMemberLoginLogRepository mbhMemberLoginLogRepository;

    @PersistenceContext
    private EntityManager em;

    public MbhMemberLoginLogDto.Item getById(String id) {
        MbhMemberLoginLogDto.Item dto = mbhMemberLoginLogMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public MbhMemberLoginLog findById(String id) {
        return mbhMemberLoginLogRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return mbhMemberLoginLogRepository.existsById(id);
    }

    public List<MbhMemberLoginLogDto.Item> getList(MbhMemberLoginLogDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return mbhMemberLoginLogMapper.selectList(VoUtil.voToMap(req));
    }

    public MbhMemberLoginLogDto.PageResponse getPageData(MbhMemberLoginLogDto.Request req) {
        PageHelper.addPaging(req);
        MbhMemberLoginLogDto.PageResponse res = new MbhMemberLoginLogDto.PageResponse();
        List<MbhMemberLoginLogDto.Item> list = mbhMemberLoginLogMapper.selectPageList(VoUtil.voToMap(req));
        long count = mbhMemberLoginLogMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public MbhMemberLoginLog create(MbhMemberLoginLog body) {
        body.setLogId(CmUtil.generateId("mbh_member_login_log"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbhMemberLoginLog saved = mbhMemberLoginLogRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbhMemberLoginLog save(MbhMemberLoginLog entity) {
        if (!existsById(entity.getLogId()))
            throw new CmBizException("존재하지 않는 MbhMemberLoginLog입니다: " + entity.getLogId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbhMemberLoginLog saved = mbhMemberLoginLogRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbhMemberLoginLog update(String id, MbhMemberLoginLog body) {
        MbhMemberLoginLog entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "logId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbhMemberLoginLog saved = mbhMemberLoginLogRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public MbhMemberLoginLog updatePartial(MbhMemberLoginLog entity) {
        if (entity.getLogId() == null) throw new CmBizException("logId 가 필요합니다.");
        if (!existsById(entity.getLogId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getLogId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbhMemberLoginLogMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        MbhMemberLoginLog entity = findById(id);
        mbhMemberLoginLogRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<MbhMemberLoginLog> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getLogId() != null)
            .map(MbhMemberLoginLog::getLogId)
            .toList();
        if (!deleteIds.isEmpty()) {
            mbhMemberLoginLogRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<MbhMemberLoginLog> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getLogId() != null)
            .toList();
        for (MbhMemberLoginLog row : updateRows) {
            MbhMemberLoginLog entity = findById(row.getLogId());
            VoUtil.voCopyExclude(row, entity, "logId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            mbhMemberLoginLogRepository.save(entity);
        }
        em.flush();

        List<MbhMemberLoginLog> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (MbhMemberLoginLog row : insertRows) {
            row.setLogId(CmUtil.generateId("mbh_member_login_log"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            mbhMemberLoginLogRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
