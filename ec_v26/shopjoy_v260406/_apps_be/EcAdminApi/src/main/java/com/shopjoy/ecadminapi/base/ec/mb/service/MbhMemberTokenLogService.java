package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;
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
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MbhMemberTokenLogService {

    private final MbhMemberTokenLogRepository mbhMemberTokenLogRepository;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public MbhMemberTokenLogDto.Item getById(String id) {
        MbhMemberTokenLogDto.Item dto = mbhMemberTokenLogRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbhMemberTokenLogDto.Item getByIdOrNull(String id) {
        return mbhMemberTokenLogRepository.selectById(id).orElse(null);
    }

    /* 상세조회 */
    public MbhMemberTokenLog findById(String id) {
        return mbhMemberTokenLogRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbhMemberTokenLog findByIdOrNull(String id) {
        return mbhMemberTokenLogRepository.findById(id).orElse(null);
    }

    /* 키검증 */
    public boolean existsById(String id) {
        return mbhMemberTokenLogRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!mbhMemberTokenLogRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 목록조회 */
    public List<MbhMemberTokenLogDto.Item> getList(MbhMemberTokenLogDto.Request req) {
        return mbhMemberTokenLogRepository.selectList(req);
    }

    /* 페이지조회 */
    public MbhMemberTokenLogDto.PageResponse getPageData(MbhMemberTokenLogDto.Request req) {
        PageHelper.addPaging(req);
        return mbhMemberTokenLogRepository.selectPageList(req);
    }

    /* 등록 */
    @Transactional
    public MbhMemberTokenLog create(MbhMemberTokenLog body) {
        body.setLogId(CmUtil.generateId("mbh_member_token_log"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbhMemberTokenLog saved = mbhMemberTokenLogRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 저장 */
    @Transactional
    public MbhMemberTokenLog save(MbhMemberTokenLog entity) {
        if (!existsById(entity.getLogId()))
            throw new CmBizException("존재하지 않는 MbhMemberTokenLog입니다: " + entity.getLogId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbhMemberTokenLog saved = mbhMemberTokenLogRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 수정 */
    @Transactional
    public MbhMemberTokenLog update(String id, MbhMemberTokenLog body) {
        MbhMemberTokenLog entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "logId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbhMemberTokenLog saved = mbhMemberTokenLogRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 수정 */
    @Transactional
    public MbhMemberTokenLog updateSelective(MbhMemberTokenLog entity) {
        if (entity.getLogId() == null) throw new CmBizException("logId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getLogId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getLogId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbhMemberTokenLogRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 삭제 */
    @Transactional
    public void delete(String id) {
        MbhMemberTokenLog entity = findById(id);
        mbhMemberTokenLogRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 목록저장 */
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
