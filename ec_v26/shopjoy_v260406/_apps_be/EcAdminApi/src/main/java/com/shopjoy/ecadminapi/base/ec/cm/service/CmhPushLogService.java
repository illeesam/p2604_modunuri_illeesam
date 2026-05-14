package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmhPushLogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmhPushLog;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmhPushLogRepository;
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
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmhPushLogService {

    private final CmhPushLogRepository cmhPushLogRepository;

    @PersistenceContext
    private EntityManager em;

    public CmhPushLogDto.Item getById(String id) {
        CmhPushLogDto.Item dto = cmhPushLogRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmhPushLogDto.Item getByIdOrNull(String id) {
        return cmhPushLogRepository.selectById(id).orElse(null);
    }

    public CmhPushLog findById(String id) {
        return cmhPushLogRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmhPushLog findByIdOrNull(String id) {
        return cmhPushLogRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return cmhPushLogRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!cmhPushLogRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<CmhPushLogDto.Item> getList(CmhPushLogDto.Request req) {
        return cmhPushLogRepository.selectList(req);
    }

    public CmhPushLogDto.PageResponse getPageData(CmhPushLogDto.Request req) {
        PageHelper.addPaging(req);
        return cmhPushLogRepository.selectPageList(req);
    }

    @Transactional
    public CmhPushLog create(CmhPushLog body) {
        body.setLogId(CmUtil.generateId("cmh_push_log"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmhPushLog saved = cmhPushLogRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmhPushLog save(CmhPushLog entity) {
        if (!existsById(entity.getLogId()))
            throw new CmBizException("존재하지 않는 CmhPushLog입니다: " + entity.getLogId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmhPushLog saved = cmhPushLogRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmhPushLog update(String id, CmhPushLog body) {
        CmhPushLog entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "logId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmhPushLog saved = cmhPushLogRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmhPushLog updateSelective(CmhPushLog entity) {
        if (entity.getLogId() == null) throw new CmBizException("logId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getLogId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getLogId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmhPushLogRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        CmhPushLog entity = findById(id);
        cmhPushLogRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<CmhPushLog> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getLogId() != null)
            .map(CmhPushLog::getLogId)
            .toList();
        if (!deleteIds.isEmpty()) {
            cmhPushLogRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<CmhPushLog> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getLogId() != null)
            .toList();
        for (CmhPushLog row : updateRows) {
            CmhPushLog entity = findById(row.getLogId());
            VoUtil.voCopyExclude(row, entity, "logId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            cmhPushLogRepository.save(entity);
        }
        em.flush();

        List<CmhPushLog> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (CmhPushLog row : insertRows) {
            row.setLogId(CmUtil.generateId("cmh_push_log"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            cmhPushLogRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
